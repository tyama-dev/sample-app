# 複数アプリでのSSO(Keycloakを介した認証)

`docs/auth-flow.md`は「1つのアプリとKeycloak」の話だったが、ここでは「複数アプリが同じKeycloakを共有する場合、どうやってSSO(Single Sign-On、一度のログインで複数アプリを横断できる状態)が成立するか」を整理する。

## 前提構成

- **ポータルアプリ**: 入り口となるNext.jsアプリ(`better-auth`を使用)。ユーザーはまずここでログインする
- **サブシステムアプリ(複数)**: ポータルからリンクされる、それぞれ別のNext.jsアプリ(それぞれ独自に`better-auth`を使用)
- 全アプリが**同じKeycloak・同じrealm**に対して、それぞれ**別々のClient**として登録されている(`portal-app`, `subsystem-a`, `subsystem-b`のように、Clientごとに`client_id`/`client_secret`/`redirect_uri`は別)
- 各アプリは`docs/auth-flow.md`と全く同じOAuth Authorization Code Flow(+PKCE)を、**それぞれ独立して**Keycloakに対して行う

## よくある誤解

「Keycloakのアクセストークンをどこか共通のCookieに保存していて、それを各アプリが読みにいく」という理解は誤り。ブラウザのCookieはドメインごとに隔離されており、ポータルアプリのCookieをサブシステムアプリのサーバー/JSから読むことはできない。SSOを成立させているのは、**各アプリのCookieではなく、Keycloak自身が持つセッションCookie**である。

## 仕組み

### 1. ポータルアプリへの初回ログイン

`docs/auth-flow.md`のフローそのまま。

- **[Keycloak→ブラウザ]** ログイン成功時、Keycloakは認可コードを発行するのと同時に、**Keycloak自身のドメイン(例: `https://idp.example.com`)に対するセッションCookie**(`KEYCLOAK_SESSION`など)をブラウザにセットする。これは`portal-app`のものでも`better-auth`のものでもなく、**Keycloakというサーバー自身が管理するCookie**
- ポータルアプリは通常通り、自分自身のセッション(`better-auth.session_token`)とKeycloakトークンのコピー(DBの`account`テーブル)を持つ

### 2. ポータル内のリンクからサブシステムへ遷移

- **[ブラウザ]** ユーザーがポータル内の「サブシステムA」へのリンクをクリック。このリンクは単純に**サブシステムAのURL**(別ドメイン/別ポートの、別アプリ)への遷移であり、トークンや認可コードを引き継ぐような特別な仕組みは無い
- **[サブシステムA]** サブシステムAは、まだ自分自身のセッションCookie(サブシステムA用の`better-auth.session_token`)を持っていないユーザーを検知し、`docs/auth-flow.md`と同じ`/login`フローを開始する(サブシステムA自身の`client_id`でKeycloakへリダイレクト)

### 3. Keycloakが「ログイン済み」と判定し、即座に認可コードを発行

- **[ブラウザ→Keycloak]** サブシステムAからのリダイレクトでKeycloakにアクセスする際、ブラウザは(同じKeycloakドメイン宛なので自動的に)ステップ1でセットされた**Keycloak自身のセッションCookie**を一緒に送る
- **[Keycloak]** そのCookieを見て「このブラウザは既にログイン済みだ」と判定し、**ログイン画面を表示せず**、サブシステムA用の新しい認可コードを即座に発行してリダイレクトする。ユーザーはパスワードの再入力を求められない(ここがSSOの体感部分)

### 4. サブシステムAが自分自身のセッションを確立

- **[サブシステムA→Keycloak]** サブシステムAは、受け取った認可コードを使って**自分自身の`client_id`/`client_secret`で**Keycloakのトークンエンドポイントに問い合わせ、**サブシステムA独自のトークン一式**(ポータルのものとは別)を取得する
- **[サブシステムA]** 自分自身のDBに、ユーザー・アカウント・セッションレコードを作成し(初回アクセスなら新規作成)、サブシステムA用の`better-auth.session_token`をブラウザにセットする

## ポイント

- SSOを成立させているのは**Keycloak自身のセッションCookie**であり、各アプリ間でトークンやCookieを直接共有する仕組みは存在しない
- 各アプリ(ポータル・サブシステムA・サブシステムB...)は、**それぞれ独立したセッション**と**それぞれ独立したKeycloakトークンのコピー**を、それぞれ自分のDBに持つ。ユーザーから見れば1回のログインで済むが、裏側では各アプリごとに別々のOAuthのやり取りとDBレコードが発生している
- この仕組みが成立する前提は、**全アプリが同じKeycloakインスタンス・同じrealmにリダイレクトすること**(ブラウザがKeycloakのセッションCookieを共有できる状態であること)
- 未検討事項(別途整理が必要): **Single Logout(SLO)**。Keycloak側でログアウトした場合に、各アプリ側の独自セッション(`better-auth.session_token`)まで連動して無効化する仕組みは、今回のフローには含まれていない。これは別途Keycloakのback-channel logoutなどの仕組みを使う必要がある
