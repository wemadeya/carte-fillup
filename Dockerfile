# Utilise l'image officielle Nginx comme image de base
FROM nginx:alpine

# Crée un répertoire de travail dans le conteneur
WORKDIR /app

# Copie les fichiers HTML et CSS dans le répertoire de contenu Nginx
COPY . /usr/share/nginx/html

# Expose le port que l'application va utiliser
EXPOSE 80

# Démarre Nginx
CMD ["nginx", "-g", "daemon off;"]
