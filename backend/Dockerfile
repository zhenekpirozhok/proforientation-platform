# Build stage
FROM maven:3.9.6-amazoncorretto-21 AS builder
WORKDIR /build

COPY certs/ /tmp/certs/

RUN set -eux; \
  for f in /tmp/certs/*; do \
    echo "Importing $f"; \
    keytool -importcert -noprompt -trustcacerts \
      -alias "$(basename "$f")" \
      -file "$f" \
      -cacerts \
      -storepass changeit || true; \
  done

COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests clean package


# Runtime stage
FROM amazoncorretto:21
WORKDIR /app

COPY certs/ /tmp/certs/

RUN set -eux; \
  for f in /tmp/certs/*; do \
    echo "Importing $f"; \
    keytool -importcert -noprompt -trustcacerts \
      -alias "$(basename "$f")" \
      -file "$f" \
      -cacerts \
      -storepass changeit || true; \
  done

COPY --from=builder /build/target/*.jar backend.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "/app/backend.jar"]
