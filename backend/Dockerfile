FROM amazoncorretto:21
WORKDIR /build
COPY . .
RUN yum install -y tar gzip dos2unix && dos2unix ./mvnw && ./mvnw clean package


FROM amazoncorretto:21

RUN yum -y install jq
COPY --from=0 /build/target/*.jar backend.jar

# Set the default command to run the Java application
ENTRYPOINT ["java", "-Xmx1024M", "-jar", "/backend.jar"]