# 認証フロー(Keycloak + better-auth, Authorization Code Flow with PKCE)

## 登場人物
- **ブラウザ**: エンドユーザーが操作するクライアント
- **アプリサーバー(better-auth)**: Next.jsのサーバーサイド。confidential client(`client_secret`を保持)
- **Keycloak**: OIDCプロバイダ(IdP)。realm: `sample-app`、client: `nextjs-app`

## 前提となる設定
- Keycloak Client
  - Client authentication: ON(confidential client)
  - Standard flow(Authorization Code Flow): ON
  - PKCE: S256
  - Valid redirect URIs: `http://localhost:3000/api/auth/callback/keycloak`
- Valid redirect URIsは「認可コードを返してよい戻り先」のホワイトリスト。アプリが指定した`redirect_uri`がここに登録されたものと一致しない場合、Keycloakはリダイレクト自体を拒否する(認可コード横取り攻撃を防ぐため)

## フロー

0. ユーザーがアプリの「ログイン」ボタンを押す

1. **PKCEの準備(better-authのサーバー側)**
   - ランダムな`code_verifier`を生成し、サーバー側で一時保管
   - `code_verifier`のSHA256ハッシュ`code_challenge`を計算

2. **ブラウザをKeycloakの認可エンドポイントへリダイレクト**
   `http://localhost:8080/realms/sample-app/protocol/openid-connect/auth` に以下のパラメータを付けてリダイレクトさせる
   - `client_id=nextjs-app`
   - `redirect_uri=http://localhost:3000/api/auth/callback/keycloak`
   - `response_type=code`
   - `scope=openid ...`
   - `code_challenge`, `code_challenge_method=S256`
   - `state`(CSRF対策のランダム値)

3. **Keycloakが`redirect_uri`を検証**
   Clientに登録した`Valid redirect URIs`と一致するかチェック。不一致ならここでエラーになり先に進まない

4. **ログイン画面でユーザーが認証**
   ユーザー名+パスワードを入力し、Keycloakが検証

5. **Keycloakが認可コードを発行してリダイレクト**
   認証成功後、認可コードを`code_challenge`と紐づけて一時保存し、`http://localhost:3000/api/auth/callback/keycloak?code=xxx&state=yyy` にブラウザをリダイレクト

6. **ブラウザがコールバックURLにアクセス**
   better-authのコールバック処理(サーバーサイド)が実行される。まず`state`を検証してCSRFでないことを確認

7. **better-authがトークンエンドポイントに直接リクエスト(ブラウザを介さない、サーバー間通信)**
   `http://localhost:8080/realms/sample-app/protocol/openid-connect/token` に対して以下を送る
   - `grant_type=authorization_code`
   - `code`(受け取った認可コード)
   - `redirect_uri`(照合用に再送)
   - `client_id` / `client_secret`(confidential clientの証明)
   - `code_verifier`(ステップ1で生成した元の値。PKCE)

8. **Keycloakが検証してトークンを発行**
   - `client_id`/`client_secret`が正しいか
   - `code_verifier`のハッシュが、ステップ2で送った`code_challenge`と一致するか
   - 認可コードが未使用・有効期限内か
   すべて通れば、IDトークン・アクセストークン・リフレッシュトークンを返す

9. **better-authがIDトークンを検証**
   署名(Keycloakの公開鍵で検証)、issuer、audienceなどをチェックし、ユーザー情報(`sub`, `email`など)を取り出す

10. **better-authが自分のDB(`app`データベース)に保存**
    - ユーザー情報(初回なら新規作成)
    - Keycloakから受け取ったトークン一式(account的なテーブル)
    - 新しいセッションレコード

11. **better-authがブラウザにセッションCookieを発行**
    HttpOnly・Secureな、better-auth独自のセッションCookieをセットしてレスポンスを返す。ここでログイン完了

12. **以降のリクエスト**
    ブラウザは毎回このセッションCookieを送るだけ。better-authはCookieの値をDBのセッションテーブルと照合してユーザーを特定する。Keycloakの生トークンはずっとサーバー側に留まったまま、ブラウザには一切渡らない

## ポイント
- ブラウザが最終的に持つのは **better-auth独自のセッションCookie** であり、Keycloakの生トークン(IDトークン/アクセストークン)そのものではない
- 認可コードの交換(ステップ7〜8)は常にサーバー間通信で行われ、ブラウザは関与しない
- PKCE(`code_verifier`/`code_challenge`)は、confidential clientであっても認可コード横取り攻撃への多層防御として有効化している
