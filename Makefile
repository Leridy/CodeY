# CodeY Makefile
# 提供常用的开发和构建命令

.PHONY: dev dev-web build test lint format clean help

# 默认目标
help: ## 显示帮助信息
	@echo "CodeY 开发命令"
	@echo ""
	@echo "使用方式: make <command>"
	@echo ""
	@echo "可用命令:"
	@echo "  dev          启动 Desktop 开发模式 (Tauri + Vite)"
	@echo "  dev-web      启动 Web 开发模式 (仅前端)"
	@echo "  build        构建生产版本"
	@echo "  test         运行所有测试"
	@echo "  test-frontend 运行前端测试"
	@echo "  test-backend 运行后端测试"
	@echo "  lint         代码检查"
	@echo "  format       代码格式化"
	@echo "  clean        清理构建产物"
	@echo "  install      安装依赖"
	@echo "  check        运行所有检查 (lint + test)"

# 开发命令
dev: ## 启动 Desktop 开发模式
	@echo "🚀 启动 Desktop 开发模式..."
	pnpm tauri dev

dev-web: ## 启动 Web 开发模式
	@echo "🌐 启动 Web 开发模式..."
	pnpm dev

# 构建命令
build: ## 构建生产版本
	@echo "🔨 构建生产版本..."
	pnpm build
	@echo "✅ 前端构建完成"

build-desktop: ## 构建 Desktop 安装包
	@echo "📦 构建 Desktop 安装包..."
	pnpm tauri build
	@echo "✅ Desktop 构建完成"

build-all: build build-desktop ## 构建所有版本
	@echo "✅ 所有版本构建完成"

# 测试命令
test: ## 运行所有测试
	@echo "🧪 运行所有测试..."
	pnpm test
	cargo test

test-frontend: ## 运行前端测试
	@echo "🧪 运行前端测试..."
	pnpm test

test-backend: ## 运行后端测试
	@echo "🧪 运行后端测试..."
	cargo test

test-coverage: ## 运行测试并生成覆盖率报告
	@echo "📊 生成测试覆盖率报告..."
	pnpm test:coverage

test-e2e: ## 运行 E2E 测试
	@echo "🧪 运行 E2E 测试..."
	pnpm test:e2e

# 代码质量
lint: ## 代码检查
	@echo "🔍 运行代码检查..."
	pnpm lint
	cargo clippy

format: ## 代码格式化
	@echo "✨ 格式化代码..."
	pnpm format
	cargo fmt

format-check: ## 检查代码格式
	@echo "🔍 检查代码格式..."
	pnpm prettier --check "src/**/*.{ts,tsx,css}"
	cargo fmt --check

# 依赖管理
install: ## 安装依赖
	@echo "📥 安装依赖..."
	pnpm install
	@echo "✅ 依赖安装完成"

install-rust: ## 安装 Rust 工具链
	@echo "📥 安装 Rust 工具链..."
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	source $HOME/.cargo/env
	@echo "✅ Rust 工具链安装完成"

# 清理
clean: ## 清理构建产物
	@echo "🧹 清理构建产物..."
	rm -rf dist/
	rm -rf target/debug/
	rm -rf target/release/
	rm -rf node_modules/.vite/
	@echo "✅ 清理完成"

clean-all: ## 清理所有构建产物和依赖
	@echo "🧹 清理所有构建产物和依赖..."
	rm -rf dist/
	rm -rf target/
	rm -rf node_modules/
	rm -rf pnpm-lock.yaml
	@echo "✅ 清理完成"

# 综合命令
check: lint test ## 运行所有检查 (lint + test)
	@echo "✅ 所有检查通过"

dev-check: format lint test ## 开发前检查 (format + lint + test)
	@echo "✅ 开发前检查完成"

# 信息命令
info: ## 显示项目信息
	@echo "📋 CodeY 项目信息"
	@echo ""
	@echo "版本: $(shell cat package.json | grep '"version"' | cut -d'"' -f4)"
	@echo "Node: $(shell node --version)"
	@echo "pnpm: $(shell pnpm --version)"
	@echo "Rust: $(shell rustc --version 2>/dev/null || echo '未安装')"
	@echo "Cargo: $(shell cargo --version 2>/dev/null || echo '未安装')"
	@echo ""
	@echo "前端测试: $(shell pnpm test --run 2>/dev/null | tail -1 || echo '未运行')"
	@echo "后端测试: $(shell cargo test 2>/dev/null | tail -1 || echo '未运行')"

status: ## 显示项目状态
	@echo "📊 CodeY 项目状态"
	@echo ""
	@echo "Git 分支: $(shell git branch --show-current)"
	@echo "Git 状态: $(shell git status --short | wc -l | tr -d ' ') 个文件有变更"
	@echo "最后提交: $(shell git log -1 --oneline)"
	@echo ""
	@echo "构建状态:"
	@test -d dist && echo "  前端: ✅ 已构建" || echo "  前端: ❌ 未构建"
	@test -d target/debug && echo "  后端: ✅ 已构建" || echo "  后端: ❌ 未构建"
