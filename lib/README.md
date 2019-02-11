# Shared lib

This package contains code shared between our client and server. It's included as a dependency in FluApi and FluTrack, referenced as a local `file:` dependency (i.e. not published to npm). The build output is checked into source control so that only people modifying this code have to worry about recompiling it.

If you need to make a change here, run `yarn build` after you edit the typescript, and `yarn upgrade audere-lib` in FluApi or FluTrack to see the change reflected there. Be sure to include the changes in `dist` when you commit your changes.
