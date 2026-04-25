#!/bin/bash
# Process Autopilot - Full Stack Launcher
# Usage: ./launch.sh [dev|test|prod]

set -euo pipefail

MODE="${1:-dev}"
COMPOSE_FILE="docker-compose.yml"
HEALTH_TIMEOUT=120

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || { log_error "Docker not installed"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose not installed"; exit 1; }
    
    docker info >/dev/null 2>&1 || { log_error "Docker daemon not running"; exit 1; }
    
    log_success "Prerequisites OK"
}

load_env() {
    if [ -f .env ]; then
        log_info "Loading environment variables..."
        export $(grep -v '^#' .env | xargs)
    else
        log_warn ".env file not found, using defaults"
    fi
}

clean_environment() {
    log_info "Cleaning environment..."
    docker-compose -f $COMPOSE_FILE down -v --remove-orphans 2>/dev/null || true
    docker system prune -f --volumes 2>/dev/null || true
    log_success "Environment cleaned"
}

build_services() {
    log_info "Building services..."
    docker-compose -f $COMPOSE_FILE build --parallel
    log_success "Build complete"
}

start_services() {
    log_info "Starting services in $MODE mode..."
    
    if [ "$MODE" == "test" ]; then
        docker-compose -f $COMPOSE_FILE --profile test up -d
    elif [ "$MODE" == "prod" ]; then
        docker-compose -f $COMPOSE_FILE --profile prod up -d
    else
        docker-compose -f $COMPOSE_FILE --profile monitoring up -d
    fi
}

health_check() {
    log_info "Running health checks..."
    
    local services=(
        "frontend:3000:/health"
        "backend:4000:/health"
        "vision:8000:/health"
        "execution:4001:/health"
        "sentinel:8001:/api/v1/health"
        "minio:9000:/minio/health/live"
        "prometheus:9090:/-/healthy"
        "grafana:3001:/api/health"
    )
    
    local failed=0
    local start_time=$(date +%s)
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port path <<< "$service"
        local url="http://localhost:${port}${path}"
        local healthy=false
        
        while true; do
            if curl -sf "$url" >/dev/null 2>&1; then
                log_success "$name is healthy"
                healthy=true
                break
            fi
            
            local elapsed=$(($(date +%s) - start_time))
            if [ $elapsed -gt $HEALTH_TIMEOUT ]; then
                log_error "$name failed to start (timeout)"
                docker-compose logs "$name" --tail 50
                failed=1
                break
            fi
            
            sleep 2
        done
    done
    
    if [ $failed -eq 1 ]; then
        log_error "Some services failed to start"
        show_logs
        exit 1
    fi
}

show_logs() {
    echo ""
    log_info "Recent logs:"
    docker-compose -f $COMPOSE_FILE logs --tail 20
}

show_status() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     🎉 Process Autopilot is FULLY OPERATIONAL!             ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  📱 Frontend:        http://localhost:3000                 ║"
    echo "║  🔌 Backend API:     http://localhost:4000                 ║"
    echo "║  👁️  Vision Engine:   http://localhost:8000                 ║"
    echo "║  ⚡ Execution:       http://localhost:4001                 ║"
    echo "║  🛡️  Sentinel:        http://localhost:8001                 ║"
    echo "║  📦 MinIO Console:   http://localhost:9001                 ║"
    echo "║  📊 Prometheus:      http://localhost:9090                 ║"
    echo "║  📈 Grafana:         http://localhost:3001                 ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  🧪 Run tests:                                             ║"
    echo "║     cd tests/e2e && npm test                               ║"
    echo "║     docker-compose exec sentinel pytest                    ║"
    echo "║     docker-compose exec execution npm test                 ║"
    echo "╚════════════════════════════════════════════════════════════╝"
}

run_tests() {
    if [ "$MODE" == "test" ]; then
        log_info "Running E2E tests..."
        cd tests/e2e
        npx playwright test
        cd ../..
    fi
}

stop_services() {
    log_info "Stopping services..."
    docker-compose -f $COMPOSE_FILE down
    log_success "Services stopped"
}

trap 'log_warn "Interrupted"; stop_services; exit 1' INT

main() {
    case "$MODE" in
        dev|test|prod)
            check_prerequisites
            load_env
            clean_environment
            build_services
            start_services
            health_check
            show_status
            run_tests
            ;;
        stop)
            stop_services
            ;;
        logs)
            show_logs
            ;;
        *)
            echo "Usage: $0 [dev|test|prod|stop|logs]"
            exit 1
            ;;
    esac
}

main "$@"
