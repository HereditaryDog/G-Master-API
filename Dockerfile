FROM public.ecr.aws/docker/library/node:22-alpine AS web-builder

WORKDIR /build
COPY web/package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY ./web ./
COPY ./VERSION ./
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(cat VERSION) npm run build

FROM public.ecr.aws/docker/library/golang:1.25.1-alpine AS builder
ENV GO111MODULE=on CGO_ENABLED=0

ARG TARGETOS
ARG TARGETARCH
ENV GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64}
ENV GOEXPERIMENT=greenteagc

WORKDIR /build

ADD go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=web-builder /build/dist ./web/dist
RUN go build -ldflags "-s -w -X 'github.com/yangjunyu/G-Master-API/common.Version=$(cat VERSION)'" -o g-master-api

FROM public.ecr.aws/docker/library/debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tzdata libasan8 wget \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

COPY --from=builder /build/g-master-api /
EXPOSE 3000
WORKDIR /data
ENTRYPOINT ["/g-master-api"]
