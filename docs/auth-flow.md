# 認証の仕組み(Keycloak + better-auth, Authorization Code Flow with PKCE)

Keycloak(OIDCプロバイダ/IdP)とbetter-auth(認証ライブラリ)を組み合わせて、Next.jsアプリにログイン・ログアウトを実装する場合の仕組みを整理する。

## 登場人物

| 登場人物 | 役割 |
|---|---|
| ブラウザ | エンドユーザーの操作端末 |
| アプリサーバー | Next.jsのサーバーサイド。better-authの`auth`インスタンスを持つ。confidential client(`client_secret`を保持) |
| better-authの内部ルーター | アプリサーバー内で、リクエストのパス・メソッドから実際に処理すべき機能を振り分ける |
| Keycloak | OIDCプロバイダ(IdP)。realmの下にClientを登録し、ユーザー認証・トークン発行を行う |

## 前提となるKeycloak Client設定

- Client authentication: ON(confidential client。`client_secret`を持たせる)
- Standard flow(Authorization Code Flow): ON
- PKCE: S256
- Valid redirect URIs: ログイン成功後にKeycloakが認可コードを返してよい戻り先のホワイトリスト。アプリが指定した`redirect_uri`がここに登録されたものと一致しない場合、Keycloakはリダイレクト自体を拒否する(認可コード横取り攻撃を防ぐため)
- Valid post logout redirect URIs: ログアウト後にKeycloakが戻ってよい戻り先のホワイトリスト(考え方はValid redirect URIsと同じ)

## better-authのルーティングの仕組み

better-authは、コア機能やプラグイン(`genericOAuth`など)が持つ全エンドポイントを、起動時に自身の内部ルーターへ「このHTTPメソッド+このパスパターンならこの処理」という形で登録しておく。リクエストが来るたびに、URLからbetter-authをマウントしている接頭辞(例: `/api/auth`)を除いた残りのパスとHTTPメソッドの組み合わせで、登録済みのルートを検索する。動的セグメント(`:providerId`など)もここで解決される。

アプリ側がフレームワークのルーティング機構(Next.jsのRoute Handlerなど)でこのマウントポイントを1つ用意し、その配下に来るリクエストを丸ごとbetter-authに渡す。実際に「これはサインインの処理だ」「これはコールバックの処理だ」と判断する実体は、フレームワーク側ではなくbetter-auth自身の内部ルーターが持っている。

## ログインフロー

0. **[ブラウザ]** ユーザーがログインを開始する

1. **[ブラウザ→アプリ]** アプリがKeycloakへのサインインを開始する(内部的には`POST .../sign-in/oauth2`相当の処理)

2. **[アプリ]** better-authがサインイン処理を実行
   - ランダムな`state`(CSRF対策の合言葉)と`code_verifier`(PKCE用)を生成
   - `code_verifier`のSHA256ハッシュ`code_challenge`を計算
   - `state`や`code_verifier`など、この後の検証に必要なデータをサーバー側(DB)に保存する
   - Keycloakの認可エンドポイントURL(`client_id`, `redirect_uri`, `code_challenge`, `state`などを含む)を組み立てる

3. **[アプリ→ブラウザ]** 組み立てたURLへブラウザをリダイレクトさせる。**ここで初めて実際にKeycloakへ移動する**

4. **[Keycloak]** リクエストの`redirect_uri`が、Clientに登録した`Valid redirect URIs`と一致するかチェック。不一致ならここでエラーになり先に進まない

5. **[ブラウザ⇔Keycloak]** ログイン画面が表示され、ユーザーがユーザー名+パスワードを入力。Keycloakが検証する(アプリはこの入力内容を一切見ない)

6. **[Keycloak→ブラウザ]** 認証成功後、認可コードを`code_challenge`と紐づけて一時保存し、HTTPの302リダイレクトでアプリのコールバックURLにブラウザを送る。ブラウザがこれをたどるため`GET`リクエストになる

7. **[ブラウザ→アプリ]** アプリがコールバックを受け取り、まず`state`を検証してCSRFでないことを確認

8. **[アプリ→Keycloak]** アプリのサーバーが、Keycloakのトークンエンドポイントに対して**サーバー間通信(ブラウザを介さない)**で以下を送る
   - `grant_type=authorization_code`
   - `code`(受け取った認可コード)
   - `redirect_uri`(照合用に再送)
   - `client_id` / `client_secret`(confidential clientの証明)
   - `code_verifier`(ステップ2で生成した元の値。PKCE)

9. **[Keycloak]** 以下を検証してトークンを発行
   - `client_id`/`client_secret`が正しいか
   - `code_verifier`のハッシュが、ステップ2で送った`code_challenge`と一致するか
   - 認可コードが未使用・有効期限内か
   すべて通れば、IDトークン・アクセストークン・リフレッシュトークンを返す

10. **[アプリ]** IDトークンを検証(署名をKeycloakの公開鍵でチェック、issuer・audienceなどを確認)し、ユーザー情報(`sub`, `email`など)を取り出す

11. **[アプリ]** 自分のDBに保存
    - ユーザー情報(初回なら新規作成)
    - Keycloakから受け取ったトークン一式(アカウント/連携情報として)
    - 新しいセッションレコード

12. **[アプリ→ブラウザ]** HttpOnly・Secureな、アプリ独自のセッションCookieをセットしてレスポンスを返す。ここでログイン完了

13. **[ブラウザ→アプリ]** 以降のリクエストでは、ブラウザは毎回このセッションCookieを送るだけ。アプリはCookieの値をDBのセッション情報と照合してユーザーを特定する。Keycloakの生トークンはずっとアプリのサーバー側に留まったまま、ブラウザには一切渡らない

## `state`検証の仕組み

`state`は「Keycloakが認可コードを発行するために使うもの」ではない。**アプリが、後でKeycloakから返ってきたレスポンスが本当に自分が開始したリクエストへの返答かを確認するための、CSRF対策の使い捨てトークン**である。Keycloakは`state`の中身を一切解釈せず、預かって右から左にそのまま返すだけの「荷札」として扱う。

信頼性を高めるため、`state`はDB(サーバー側の永続データ)とCookie(ブラウザ側)の**2箇所に保存**され、コールバック時に両方が一致するかを照合する設計になっていることが多い。一致しない(またはCookie自体が存在しない)場合は、`state`不一致のエラーとして処理が中断される。

## ログアウトフロー

「ログアウト」で必ずやるべきことは2つある。

1. **アプリ側のローカルログアウト**: アプリが発行したセッションレコードの削除+セッションCookieの削除
2. **Keycloak側のセッション終了**: Keycloak自身が持つセッション(ブラウザとKeycloak間のログイン状態)を終了させないと、ユーザーが再度ログインを試みた際にKeycloakが「ログイン済み」と判定し、パスワード入力なしで即座に再ログインしてしまう(SSOの仕組みがそのまま働くため)。ローカルログアウトだけでは「アプリからは見えなくなるが、Keycloak上はログインしたまま」という状態になり得る

**フロー**

0. **[ブラウザ]** ユーザーがログアウトを開始する

1. **[アプリ]** 現在のセッションを確認し、そのユーザーに紐づくKeycloakのIDトークンを取得する

2. **[アプリ]** アプリ側のセッションレコードを削除し、セッションCookieを削除する(ローカルログアウト完了)

3. **[アプリ]** Keycloakのend session(RP-Initiated Logout)エンドポイントのURLを組み立てる。パラメータとして`id_token_hint`(手順1で取得したIDトークン。どのセッションを終了すべきかKeycloakに伝える)と`post_logout_redirect_uri`(ログアウト後の戻り先)を付与する

4. **[アプリ→ブラウザ]** そのURLへブラウザをリダイレクトさせる

5. **[Keycloak]** `id_token_hint`でセッションを特定し、`post_logout_redirect_uri`が`Valid post logout redirect URIs`に登録されたものと一致するか確認した上で、Keycloak自身のセッションを終了させる

6. **[Keycloak→ブラウザ]** `post_logout_redirect_uri`で指定したURLへリダイレクト。ここで完全ログアウト完了

## ポイント

- `state`はKeycloakのためではなく、アプリ自身が「後で返ってきたレスポンスが本物か」を確認するためのCSRF対策トークン
- ブラウザが最終的に持つのは**アプリ独自のセッションCookie**であり、Keycloakの生トークン(IDトークン/アクセストークン)そのものではない
- 認可コードの交換、およびログアウト時のIDトークン取得は常にサーバー間通信・サーバー内処理で行われ、ブラウザは関与しない
- PKCE(`code_verifier`/`code_challenge`)は、confidential clientであっても認可コード横取り攻撃への多層防御として有効化する
- ローカルログアウトとKeycloak側のセッション終了は別物であり、完全なログアウトには両方が必要
- Next.jsでこの仕組みを実装する場合、Cookieの書き込みはServer ActionかRoute Handlerの中でしか許可されない点に注意が必要(通常のページ/Server Componentの中では書き込めない)
