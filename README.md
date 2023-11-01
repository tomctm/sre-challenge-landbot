# Deploying a Node.js Application on Kubernetes with Terraform, Helm, and GitHub Actions

This guide outlines the steps to deploy a Node.js application on a Google Kubernetes Engine (GKE) cluster. We will use Terraform for provisioning the GKE cluster, Helm for deploying Redis, GitHub Actions for building and pushing the Node.js application to Docker Hub, and Kubernetes for deploying the application, setting up secrets, services, and autoscaling.

## Prerequisites

Before you begin, ensure that you have the following prerequisites:

- [Google Cloud Platform (GCP) account](https://cloud.google.com/)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs)
- [Terraform](https://www.terraform.io/downloads.html)
- [Helm](https://helm.sh/docs/intro/install/)
- [GitHub Actions setup with Docker Hub credentials](https://docs.github.com/en/actions)


## Exercise 1: Generate Pipelines to Build and deploy NodeJS app:

1.I have chosen to create the build and deploy pipeline in Github Actions. We can check it in the directory`.github/workflows/build-and-publish.yml`). The secrets to connect to DockerHub have been stored as environment variables inside the repository.

This is an example about the execution of this pipeline: https://github.com/tomctm/sre-challenge-landbot/actions/runs/6718431542


![Screenshot 2023-11-01 at 20 17 28](https://github.com/tomctm/sre-challenge-landbot/assets/8587416/1ae9071c-6370-43a4-a574-c039549fe36c)




## Exercise 2: Kubernetes, deploy the app in a kubernetes cluster.

I have chosen the Google cloud to create a GKE that allows me to deploy redis and deploy the node application that connects to it.

#### Delivery GKE with Terraform:

We will start by deploying the kubernetes cluster through terraform, we can check the code in the directory `gke-deployment`.
Once deployment has been performed with `terraform init`, `terraform apply`, We can check if the GKE is deployment correctly:

```
NAME                                                  STATUS   ROLES    AGE    VERSION
gke-grand-fx-308506--grand-fx-308506--023116aa-s71j   Ready    <none>   154m   v1.27.3-gke.100
gke-grand-fx-308506--grand-fx-308506--023116aa-xgn9   Ready    <none>   154m   v1.27.3-gke.100
````


#### Deploy Redis Cluster

The first thing we have to do inside the cluster is to deploy the redis cluster. To do this, we are going to use the default redis helm following these steps:

`````
- Add repo of bitnami in the cluster

 helm repo add bitnami https://charts.bitnami.com/bitnami

- Update the repo:

 helm repo update

- Install redis:

helm install my-release bitnami/redis
```````

We check the configuration redis:

`````
pod/redis-master-0                1/1     Running   0          157m
pod/redis-replicas-0              1/1     Running   0          157m
pod/redis-replicas-1              1/1     Running   0          157m
pod/redis-replicas-2              1/1     Running   0          156m

service/redis-headless   ClusterIP      None             <none>          6379/TCP       157m
service/redis-master     ClusterIP      10.111.249.92    <none>          6379/TCP       157m
service/redis-replicas   ClusterIP      10.111.251.107   <none>          6379/TCP       157m

statefulset.apps/redis-master     1/1     157m
statefulset.apps/redis-replicas   3/3     157m
`````

In order to use the redis password, we will obtain it with the following command:

````
kubectl get secret --namespace default redis-test -o jsonpath="{.data.redis-password}" | base64 --decode
`````


Once we have the password, let's create the secrets for the app to connect to redis:
	** in this case the better way for manage the passwords is have vault installed and inject the passwords through this tool.
	** We use `kubectl apply -f YAML-FILE.yaml` to apply the yamls.

````
apiVersion: v1
kind: Secret
metadata:
  name: redis-secrets
type: Opaque
data:
  REDIS_PASSWORD: xxxxxxxxx # the passwords have encode in base64
  REDIS_USERNAME: xxxxxxxxx
  
 `````


#### Deploy Node app 

We create the yaml with the configuration of the node app: (We can check the file `deployment-app/node-app.yaml`)
	*** Note that we need to define a maximum CPU consumption, as we will need it to set the autoscaling.
	** We use `kubectl apply -f YAML-FILE.yaml` to apply the yamls.

````
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
      - name: nodejs-app
        image: tomctm/landbot-test:latest
        ports:
        - containerPort: 3000
        env:
        - name: REDIS_HOST
          value: redis-master
        - name: REDIS_PORT
          value: "6379"
        - name: REDIS_USERNAME
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: REDIS_USERNAME
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: REDIS_PASSWORD
        resources:
          requests:
            cpu: 256m
``````

We will create the service by exposing it like LoadBalancer to the Internet: (We can check the file `deployment-app/node-service.yaml`)

We will create the autoscaler by setting a consumption of 60% so that it can lift more instances. ((We can check the file `deployment-app/node-autoscaler.yaml`)

Once the application is deployed. We can access it through the public IP that the balancer offers us:


![Screenshot 2023-11-01 at 19 30 19](https://github.com/tomctm/sre-challenge-landbot/assets/8587416/e0f70625-ba65-4aa0-9405-1c4dbf159411)


In order to test the autoscaling, we set up a pod that launches http requests against the application:


````
kubectl run -i --tty load-generator --rm --image=busybox:1.28 --restart=Never -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://nodejs-app; done"
`````


In this way, as shown in the image, we see that the autoscaler automatically starts to wash instances to cover all the requests:


![Screenshot 2023-11-01 at 18 08 42](https://github.com/tomctm/sre-challenge-landbot/assets/8587416/8bf4ad55-ec49-4b0c-91df-e3d46d1271a7)




### And to conclude, in terms of security, it should be pointed out that usually the node service was exposed to the Internet, so both the cluster and the redis service were created internally.

