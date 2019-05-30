# Reverse Proxy

This provides a MacOS startup item that attempts to maintain an ssh connection to a bastion server.
This may be useful to forward ports between the bastion and the Mac running this.

## Instructions

### On the Mac:

- Create a user with unix userid `rproxy`.
- Log in as rproxy
- In a terminal, run `ssh-keygen -t rsa -b 4096 -C rproxy`
- Edit `~/.ssh/config` to add an entry like:

```
Host bastion
  Hostname MY_HOSTNAME
  RemoteForward REMOTE_PORT localhost:22
```

- `sudo rsync -a ./ /usr/local/rproxy`
- `sudo chown -R root:wheel /usr/local/rproxy`
- `sudo ln -s /{usr/local/rproxy,Library/LaunchDaemons}/org.auderenow.rproxy.plist`

### On the bastion server:

- Create a user with unix userid `rproxy` with `/bin/bash` as shell:

```
  sudo adduser --gecos "Reverse Proxy" --disabled-password rproxy
```

- Copy the public key generated earlier to `~rproxy/.ssh/authorized_keys`.
- Ensure `~/.ssh` and `~/.ssh/authorized_keys` are 700

## Reference:

- https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html
- https://stackoverflow.com/a/29926482
- https://stackoverflow.com/a/22100106
