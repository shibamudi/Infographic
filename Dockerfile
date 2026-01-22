# 使用官方Node.js运行时作为基础镜像
FROM node:22-alpine AS base

# 安装pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 第一阶段：构建主库（精确控制文件以优化缓存）
FROM base AS builder

# 复制主库依赖文件
COPY package*.json pnpm-lock.yaml* ./

# 安装主库依赖
RUN pnpm install --frozen-lockfile

# 只复制主库源代码文件（排除site目录）
COPY src/ ./src/
COPY shared/ ./shared/
COPY .skills/ ./.skills/
COPY tsconfig.json ./
COPY scripts/ ./scripts/
COPY vite.config.ts ./
COPY eslint.config.ts ./

# 构建主库
RUN pnpm build

# 第二阶段：构建site
FROM base AS site-builder

# 接收构建参数
ARG BASE_PATH
ENV BASE_PATH=${BASE_PATH}
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

# 复制主库构建产物和package.json
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/esm ./esm
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/.skills ./.skills

# 复制site依赖文件
COPY site/package*.json site/pnpm-lock.yaml* ./site/

# 安装site依赖（包括主库）
RUN cd site && pnpm install --frozen-lockfile

# 复制site源代码
COPY site/ ./site/

# 构建site应用
RUN cd site && pnpm build-prod

# 第三阶段：生产环境运行
FROM node:22-alpine AS runner

# 安全配置
RUN apk add --no-cache dumb-init

# 安装pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 接收构建参数并设置环境变量
ARG BASE_PATH
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    BASE_PATH=${BASE_PATH}

# 复制构建产物
COPY --from=site-builder /app/site/.next ./site/.next
COPY --from=site-builder /app/site/out ./site/out
COPY --from=site-builder /app/site/public ./site/public
COPY --from=site-builder /app/site/node_modules ./site/node_modules
COPY --from=site-builder /app/site/package.json ./site/package.json

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 暴露端口
EXPOSE 3000

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "cd site && pnpm start"]