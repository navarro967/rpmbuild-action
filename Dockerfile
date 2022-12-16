# Using CentOS 7 as base image to support rpmbuild (packages will be Dist el7)
FROM centos:7

#install build common prerequisites
RUN yum install -y epel-release && \
yum install -y rpm-build rpmdevtools gcc gcc-c++ make coreutils python git jq
# Download NodeJS and install
#curl -O https://nodejs.org/dist/v18.12.1/node-v18.12.1-linux-x64.tar.xz && \ 
RUN curl -fsSL https://rpm.nodesource.com/setup_16.x | bash - && \
yum install -y nodejs

# Copying all contents of rpmbuild repo inside container
COPY . .

# All remaining logic goes inside main.js , 
# where we have access to both tools of this container and 
# contents of git repo at /github/workspace
ENTRYPOINT ["node", "/src/main.ts"]
