# CODE_CHALLENGE_BPD_TSCS

## ESTRUCTURA 

- `MS1-GETPROFILE/` – Código fuente de Microservicio 1  
- `MS2-CRUD/`         – Código fuente de Microservicio 2  
- `k8s/`              – Manifiestos de Kubernetes (Namespace, Secrets, PVC, Deployments, Services, Ingress)  
- `certs/`            – Certificados TLS auto-firmados (`cert.pem` & `key.pem`)  
- `docker-compose.yml`  
- `README.md`         – Esta documentación

## DESPLIEGUE CON KUBERNETES

1. Tener Kubernetes habilitado en Docker Desktop.  
2. Generar TLS.

En la consola:
   mkdir -p certs
   openssl req -x509 -nodes -days 365 \
     -newkey rsa:2048 \
     -keyout certs/key.pem \
     -out certs/cert.pem \
     -subj "/CN=localhost"

3. Aplicar Namespace y Secrets
En la consola:

kubectl apply -f k8s/00-namespace.yaml
kubectl -n codechallenge create secret tls tls-secret \
  --cert=certs/cert.pem \
  --key=certs/key.pem
kubectl -n codechallenge apply -f k8s/01-secrets.yaml

4. Desplegar los microservicios + base de datos

En la consola:

kubectl -n codechallenge apply -f k8s/02-mongo.yaml
kubectl -n codechallenge apply -f k8s/03-ms2-crud.yaml
kubectl -n codechallenge apply -f k8s/04-ms1-getprofile.yaml

5. Instala el ingress-NGIX

En la consola:
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

6. Crear el Ingress:
kubectl -n codechallenge apply -f k8s/05-ingress.yaml

7. Probar que no haya errores

kubectl -n codechallenge get pods,svc,endpoints,ingress






