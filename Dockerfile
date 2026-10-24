# EduTrack 生产镜像
#
# 单容器同时运行后端 API 与前端页面（前端构建产物由后端进程托管），
# 因此不需要 Nginx、也不需要额外的静态托管。
#
# 构建时所用的 npm 源已切换为国内镜像，避免云服务器拉取依赖过慢或超时。

FROM node:22-bookworm-slim

# bcrypt 为原生模块，需要编译工具链
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN npm config set registry https://registry.npmmirror.com

WORKDIR /app

COPY . .

# 先编译后端，再编译前端。
# 后端编译后裁掉 devDependencies；前端编译后删除 node_modules，只保留 dist。
RUN set -eux \
 && npm ci --prefix server \
 && npm run build --prefix server \
 && npm ci --omit=dev --prefix server \
 && npm ci --prefix client \
 && npm run build --prefix client \
 && rm -rf client/node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://127.0.0.1:3000/health',function(res){process.exit(res.statusCode<500?0:1)}).on('error',function(){process.exit(1)})"]

# 必须在仓库根目录启动，否则找不到根目录的 school_data.json 等数据文件
CMD ["node", "server/dist/index.js"]
