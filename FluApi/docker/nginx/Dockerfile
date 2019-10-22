# Copyright (c) 2019 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

FROM nginx:1.17.4-alpine
LABEL maintainer="dev@auderenow.org"

COPY ./FluApi/docker/nginx/entrypoint.sh /entrypoint.sh

CMD /entrypoint.sh
