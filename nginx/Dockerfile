FROM debian:bullseye

# RUN apt-get update && apt-get install -y \
#     nginx \
#     openssl \
#     curl \
#     apt-utils \
#     autoconf \
#     automake \
#     build-essential \
#     git \
#     libcurl4-openssl-dev \
#     libgeoip-dev \
#     liblmdb-dev \
#     libpcre++-dev \
#     libtool \
#     libxml2-dev \
#     libyajl-dev \
#     pkgconf \
#     wget \
#     zlib1g-dev \
#     && apt-get clean

RUN apt-get update && apt-get install -y \
	systemctl \
	vim \
	lsof \
	sudo \
    nginx \
    openssl \
    curl \
    apt-utils \
    && apt-get clean

RUN mkdir -p /etc/nginx/ssl


COPY ./nginx/conf/default.conf /etc/nginx/conf.d/default.conf
COPY ./nginx/conf/generate_cert.sh /usr/local/bin/generate_cert.sh
RUN mkdir -p /home/app/static

RUN chmod +x /usr/local/bin/generate_cert.sh
RUN /usr/local/bin/generate_cert.sh

# RUN git clone --depth 1 -b v3/master --single-branch https://github.com/SpiderLabs/ModSecurity && \
#     cd ModSecurity && \
#     git submodule init && \
#     git submodule update && \
#     ./build.sh && \
#     ./configure && \
#     make && \
#     make install && \
#     cd .. && \
#     git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx.git

# RUN bash -c "NGINX_VERSION=\$(nginx -v 2>&1 | awk -F/ '{print \$2}'); \
#     wget http://nginx.org/download/nginx-\$NGINX_VERSION.tar.gz && \
#     tar zxvf nginx-\$NGINX_VERSION.tar.gz && \
#     cd nginx-\$NGINX_VERSION && \
#     ./configure --with-compat --add-dynamic-module=../ModSecurity-nginx && \
#     make modules && \
#     mv objs/ngx_http_modsecurity_module.so /tmp && \
#     rm -f modules && \
#     mkdir -p /etc/nginx/modules && \
#     mv /tmp/ngx_http_modsecurity_module.so /etc/nginx/modules/"

# RUN echo "load_module /etc/nginx/modules/ngx_http_modsecurity_module.so;" | cat - /etc/nginx/nginx.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/nginx.conf

# RUN mkdir -p /etc/nginx/modsec && \
#     wget -P /etc/nginx/modsec/ https://raw.githubusercontent.com/SpiderLabs/ModSecurity/v3/master/modsecurity.conf-recommended && \
#     mv /etc/nginx/modsec/modsecurity.conf-recommended /etc/nginx/modsec/modsecurity.conf && \
#     cp /ModSecurity/unicode.mapping /etc/nginx/modsec/ && \
#     sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/nginx/modsec/modsecurity.conf

# COPY ./nginx/conf/main.conf /etc/nginx/modsec/main.conf

COPY ./frontend /usr/share/nginx/html/

# RUN tail -f /dev/null

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]

