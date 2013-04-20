Attractions = new Meteor.Collection("Attractions");

base64 = {};
base64.PADCHAR = '=';
base64.ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
base64.getbyte64 = function(s,i) {
    // This is oddly fast, except on Chrome/V8.
    //  Minimal or no improvement in performance by using a
    //   object with properties mapping chars to value (eg. 'A': 0)
    var idx = base64.ALPHA.indexOf(s.charAt(i));
    if (idx == -1) {
	throw "Cannot decode base64";
    }
    return idx;
}

base64.decode = function(s) {
    // convert to string
    s = "" + s;
    var getbyte64 = base64.getbyte64;
    var pads, i, b10;
    var imax = s.length
    if (imax == 0) {
        return s;
    }

    if (imax % 4 != 0) {
	throw "Cannot decode base64";
    }

    pads = 0
    if (s.charAt(imax -1) == base64.PADCHAR) {
        pads = 1;
        if (s.charAt(imax -2) == base64.PADCHAR) {
            pads = 2;
        }
        // either way, we want to ignore this last block
        imax -= 4;
    }

    var x = [];
    for (i = 0; i < imax; i += 4) {
        b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) |
            (getbyte64(s,i+2) << 6) | getbyte64(s,i+3);
        x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
    }

    switch (pads) {
    case 1:
        b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) | (getbyte64(s,i+2) << 6)
        x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));
        break;
    case 2:
        b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12);
        x.push(String.fromCharCode(b10 >> 16));
        break;
    }
    return decodeURIComponent(escape(x.join('')));
}

base64.getbyte = function(s,i) {
    var x = s.charCodeAt(i);
    if (x > 255) {
        throw "INVALID_CHARACTER_ERR: DOM Exception 5";
    }
    return x;
}


base64.encode = function(s) {
    if (arguments.length != 1) {
	throw "SyntaxError: Not enough arguments";
    }
    s = unescape(encodeURIComponent(s));
    var padchar = base64.PADCHAR;
    var alpha   = base64.ALPHA;
    var getbyte = base64.getbyte;

    var i, b10;
    var x = [];

    // convert to string
    s = "" + s;

    var imax = s.length - s.length % 3;

    if (s.length == 0) {
        return s;
    }
    for (i = 0; i < imax; i += 3) {
        b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8) | getbyte(s,i+2);
        x.push(alpha.charAt(b10 >> 18));
        x.push(alpha.charAt((b10 >> 12) & 0x3F));
        x.push(alpha.charAt((b10 >> 6) & 0x3f));
        x.push(alpha.charAt(b10 & 0x3f));
    }
    switch (s.length - imax) {
    case 1:
        b10 = getbyte(s,i) << 16;
        x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
               padchar + padchar);
        break;
    case 2:
        b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8);
        x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
               alpha.charAt((b10 >> 6) & 0x3f) + padchar);
        break;
    }
    
    return x.join('');
}


if (Meteor.isClient) {
    Session.set("newbar", undefined);
    Session.set("cloudedimage", undefined);
				PageEvents = {};
    PageEvents["click #loginButton"] = function () {
        var options, password, username;
        username = $("#name").val();
        password = $("#password").val();
        options = {
            username: username,
            password: password
        }
        Meteor.logout();
        Accounts.createUser(options);
        Meteor.user();
        Meteor.loginWithPassword(username, password, function (err) {

            if (!err) {
                Meteor.Router.to('/admin', true);
            } else {
                alert("Bad name or password!");
            }

        });
    }
    AdminPageEvents = {};
    AdminPageEvents["click #logoutButton"] = function () {
        Meteor.logout();
        Meteor.Router.to('/', true);
    }
    getBarPageEvents = {};
    getBarPageEvents["click #getBarSelector"] = function () {
        var barSelector = $("#getBarSelector").val();
        if (barSelector != "") {
            var cur = Attractions.findOne({
                name: base64.encode(barSelector)
            });
            $("#name").val(base64.decode(cur["name"]));
            $("#address").val(base64.decode(cur["address"]));
            $("#timeDuration").val(base64.decode(cur["timeDuration"]));
            $("#minAge").val(base64.decode(cur["minAge"]));
            $("#phone").val(base64.decode(cur["phone"]));
            $('#logoContainer').html("&nbsp;");

            if (cur["logo"] != undefined) {
                $('<img src="' + cur["logo"] + '">').load(function () {
                    $(this).width(150).height(150).appendTo('#logoContainer');
                });
            }
        } else {

            $("#name").val("");
            $("#address").val("");
            $("#timeDuration").val("");
            $("#minAge").val("");
            $("#phone").val("");
            $('#logoContainer').html("&nbsp;");

        }
    }
    NewBarPageEvents = {};
    NewBarPageEvents["click #uploadlogoButton"] = function () {
        var eee = Session.get("newbar");
        if (Session.get("newbar") != undefined) {
            filepicker.setKey('AS5VjruSwRWaumPwrHEg6z');
            if (Session.get("cloudedimage") != undefined) {
                filepicker.remove(Session.get("cloudedimage"), function () {
                    console.log("Removed");
                });
            }
            filepicker.pickAndStore({
                mimetype: "image/*"
            }, {
                location: "S3"
            }, function (fpfiles) {
                Session.set("cloudedimage", fpfiles[0]);
                Attractions.update({
                    _id: Session.get("newbar")
                }, {
                    $set: {
                        logo: fpfiles[0]["url"]
                    }
                }, function (error) {
                    if (error != undefined) {
                        alert("Weird error " + error);
                    }
                });
                $('#logoContainer').html("&nbsp;");
                $('<img src="' + fpfiles[0]["url"] + '">').load(function () {
                    $(this).width(150).height(150).appendTo('#logoContainer');
                });



            });


        } else {
            alert("Weird Error: Trying to upload files without a bar");

        }
    };


    Template.getbarPage.Attractions = function () {
        var BarListSlector = [];
        var barlist = Attractions.find();
        var count = 0;
        barlist.forEach(function (bar) {
            var barName = base64.decode(bar.name);
            BarListSlector[count] = {
                name: barName
            };
            count++;
        });
        return BarListSlector;

    }

    NewBarPageEvents["click #anotherbarButton"] = function () {
        Session.set("newbar", undefined);
        Session.set("cloudedimage", undefined);
        $("#addbarButton").show();
        $('#logoContainer').html("&nbsp;");
        $("#name").attr("readonly", false);
        $("#address").attr("readonly", false);
        $("#timeDuration").attr("readonly", false);
        $("#minAge").attr("readonly", false);
        $("#phone").attr("readonly", false);
        $("#uploadlogoButton").hide();
        $("#name").val("");
        $("#address").val("");
        $("#timeDuration").val("");
        $("#minAge").val("");
        $("#phone").val("");
    };
    NewBarPageEvents["click #addbarButton"] = function () {
        var name, address, timeDuration, minAge, logo, phone, approved;
        approved = true;
        name = $("#name").val();
        address = $("#address").val();
        timeDuration = $("#timeDuration").val();
        minAge = $("#minAge").val();
        phone = $("#phone").val();
        Meteor.subscribe("Attractions");
        var barName = base64.encode(name);
        var barName2 = base64.decode(barName);
        var Cursors = Attractions.find({
            name: barName
        });
        var CurrParsed = Cursors.fetch();
        if (CurrParsed.length == 0) {
            var GenInfo = {
                name: base64.encode(name),
                address: base64.encode(address),
                timeDuration: base64.encode(timeDuration),
                minAge: base64.encode(minAge),
                phone: base64.encode(phone),
                owner: Meteor.userId()
            };
            var genValues = EJSON.stringify(GenInfo);
            var newbarID = Attractions.insert(GenInfo, function (err) {
                if (err != undefined) {
                    alert("Insertion failed for the following reason " + err);


                } else {
                    alert("Bar Added");
                    Session.set("newbar", newbarID);
                    $("#addbarButton").hide();
                    $("#uploadlogoButton").show();
                    $("#name").attr("readonly", "readonly");
                    $("#address").attr("readonly", "readonly");
                    $("#timeDuration").attr("readonly", "readonly");
                    $("#minAge").attr("readonly", "readonly");
                    $("#phone").attr("readonly", "readonly");


                }





            });
        } else {
            alert("Bar cannot be added: Exists");
        }


    }
    Template.getbarPage.events(getBarPageEvents);
    Template.newbarPage.events(NewBarPageEvents);
    Template.adminPage.events(AdminPageEvents);
    Template.userPage.events(PageEvents);
}