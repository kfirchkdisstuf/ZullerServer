


if (Meteor.isClient) {
    ClientRoutes = {};
    ClientRoutes['/'] = 'userPage';
    ClientRoutes['/redirect'] = 'redirect';

    ClientRoutes['/admin'] = 'adminPage';
    ClientRoutes['/newbar'] = 'newbarPage';
    ClientRoutes['/getbar'] = 'getbarPage';
    ClientRoutes['/getinfofromb/:id'] = function (id) {
        var hi = new String(this.querystring);
        hi = hi.toString();
        var queryLoc = hi.indexOf("=");
        var request = hi.substring(0, queryLoc);
        var result = hi.substring(queryLoc + 1);
        if (request == "getallattra") {
            Attractions.find().forEach(function (player) {
                console.log(player);
            });

        } else {
            console.log("Command not found.");
        }
    };
    Meteor.Router.add(ClientRoutes);
    Meteor.Router.filters({
        requireLogin: function (page) {
            if (Meteor.loggingIn()) {
                return 'loadingLayout';
            } else if (Meteor.user()) {
                return page;
            } else {
                return 'userPage';
            }
        }
    });
    Meteor.Router.filter('requireLogin');

    }