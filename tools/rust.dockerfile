ARG RUST_IMG=rust:1.77

FROM $RUST_IMG AS rust
ARG RUST_IMG

RUN cargo install wasm-pack

WORKDIR /src
CMD ["sh", "-c", "rm -rf pkg && wasm-pack build --target web -- --verbose --locked && rm pkg/.gitignore"]