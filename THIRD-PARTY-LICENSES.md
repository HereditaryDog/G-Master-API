# Third-Party Licenses

This file summarizes the direct third-party dependency areas used by distributed
G-Master API builds. Keep it together with Docker images, standalone binaries,
frontend bundles, and desktop installers.

Scope for this distribution:

- Backend dependencies from `go.mod`
- Frontend dependencies from `web/package.json`
- Full pinned dependency metadata from `go.sum` and `web/bun.lock`

Transitive dependency notices should be audited before a final external
redistribution package.

## Backend

| Dependency | License |
| --- | --- |
| `github.com/aws/aws-sdk-go-v2` and `github.com/aws/smithy-go` | Apache-2.0 |
| `github.com/bytedance/gopkg` | Apache-2.0 |
| `github.com/gin-gonic/gin` and Gin middleware packages | MIT |
| `github.com/glebarez/sqlite` | MIT |
| `github.com/go-redis/redis/v8` | BSD-2-Clause |
| `github.com/go-webauthn/webauthn` | BSD-3-Clause |
| `github.com/golang-jwt/jwt/v5` | MIT |
| `github.com/google/uuid` | BSD-3-Clause |
| `github.com/gorilla/websocket` | BSD-2-Clause |
| `github.com/grafana/pyroscope-go` | Apache-2.0 |
| `github.com/nicksnyder/go-i18n/v2` | MIT |
| `github.com/pquerna/otp` | Apache-2.0 |
| `github.com/samber/hot`, `github.com/samber/lo` | MIT |
| `github.com/shopspring/decimal` | MIT |
| `github.com/stretchr/testify` | MIT |
| `github.com/stripe/stripe-go/v81` | MIT |
| `github.com/tidwall/gjson`, `github.com/tidwall/sjson` | MIT |
| `github.com/waffo-com/waffo-go`, `github.com/waffo-com/waffo-pancake-sdk-go` | MIT |
| `golang.org/x/*` modules | BSD-3-Clause |
| `gorm.io/*` modules | MIT |

## Frontend

| Dependency | License |
| --- | --- |
| `@douyinfe/semi-ui`, `@douyinfe/semi-icons` | MIT |
| `@lobehub/icons` | MIT |
| `@visactor/react-vchart`, `@visactor/vchart`, `@visactor/vchart-semi-theme` | MIT |
| `axios` | MIT |
| `clsx` | MIT |
| `dayjs` | MIT |
| `i18next`, `react-i18next`, `i18next-browser-languagedetector` | MIT |
| `katex` | MIT |
| `lucide-react` | ISC |
| `marked` | MIT |
| `mermaid` | MIT |
| `qrcode.react` | ISC |
| `react`, `react-dom`, `react-router-dom` | MIT |
| `react-dropzone`, `react-icons`, `react-markdown` | MIT |
| `react-turnstile` | MIT |
| `rehype-*`, `remark-*`, `unist-util-visit` | MIT |
| `sse.js` | Apache-2.0 |
| `use-debounce` | MIT |

## License Texts

The canonical license texts for direct dependencies are available from their
published package metadata and source repositories. The G-Master API project
license is included in `LICENSE`.
