# Build Stage
FROM maven:3.9.6-amazoncorretto-21 AS builder

WORKDIR /build
COPY pom.xml .
COPY src ./src

RUN mvn -B -DskipTests clean package


# Runtime Stage
FROM amazoncorretto:21

WORKDIR /app
RUN yum -y install jq

COPY --from=builder /build/target/*.jar backend.jar
EXPOSE 8082

ENTRYPOINT ["java", "-Xmx1024M", "-jar", "/app/backend.jar"]
