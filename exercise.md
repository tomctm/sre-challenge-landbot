# SRE - DevOps Exercise

The practical exercise is to transform the attached docker compose file that models a simple Wordpress installation into an infrastructure that runs on a GKE cluster on Google Cloud Platform. The scenery assumes that we are the owners of the GCP Project *myproject-012345*. The project has already setup a DNS zone named *mydomain* which holds the DNS of the domain *mydomain.com*

For each exercise candidate must provide the scripts to deploy the elements required. In case of kubernetes elements, candidate can provide the script that generate the kubernetes manifests or the manifests themselves. Candidate can use any **automation tool** they consider suitable to simplify the tasks.

Exercise will be evaluated not only in completeness but also in simplicity and ease of deployment.

## Exercise 1 - Infrastructure

Provide scripts to create the following elements inside the GCP Project:

* A GKE cluster named *mycluster*.
* A Cloud SQL database *wpdb* to hold the WordPress database.
* A Cloud Storage *mybackups-mydomain-com* to store the database backups.
* A Google Service Account with permissions to access the Cloud Storage.

## Exercise 2 - Kubernetes

Provide scripts or kubernetes manifests to create the following elements inside *mycluster*:

* An ingress controller.
* A service named *wpdb* to access the Cloud SQL Database from within the cluster.
* A deployment named *wp* with the container image "wordpress:5.7" that use the service *wpdb*.
* A service named *wp* to access to the WordPress inside the cluster.
* An Ingress *wp* that expose the service *wp* to Internet.

Finally Create in the GCP Project a DNS entry *wordpress.mydomain.com* that points to the *wp* ingress IP.

## Exercise 3 - Extra - Managing and Monitoring

Provide scripts or kubernetes manifests for:

* A daily job to backup the database to the cloud storage.
* A way to determine how many visits has the site.

## Wordpress - Docker Compose File

```yaml
version: "3.9"
services:
  db:
    image: mysql:5.7
    volumes:
      - db_data:/var/lib/mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: somewordpress
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
  wordpress:
    depends_on:
      - db
    image: wordpress:latest
    ports:
      - "8000:80"
    restart: always
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
volumes:
  db_data: {}
```
