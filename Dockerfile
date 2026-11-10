# Utilise l'image officielle Nginx comme image de base
FROM nginx:alpine

# Crée un répertoire de travail dans le conteneur
WORKDIR /app

# Config nginx du site (Cache-Control: no-cache sur les pages, le JS et le CSS)
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copie les fichiers HTML et CSS dans le répertoire de contenu Nginx, puis
# retire la config nginx qui vient d'y être copiée (elle n'a pas à être publique)
COPY . /usr/share/nginx/html
RUN rm /usr/share/nginx/html/nginx-default.conf

# Expose le port que l'application va utiliser
EXPOSE 80

# Démarre Nginx
CMD ["nginx", "-g", "daemon off;"]
