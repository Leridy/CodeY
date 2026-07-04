use axum::{routing::get, Router};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod routes;
mod state;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "codey_server=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Build application
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .merge(routes::agent::router())
        .merge(routes::ws::router())
        .layer(CorsLayer::permissive());

    // Run server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await?;
    tracing::info!("Server listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;

    Ok(())
}

async fn root() -> &'static str {
    "CodeY Server"
}

async fn health() -> &'static str {
    "OK"
}
