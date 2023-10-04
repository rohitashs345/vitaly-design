window.IPRedirect = {
  adapter: function (res) {
    return {
      ip: res.query,
      country_code: res.countryCode,
      country_name: res.country,
      region_code: res.region,
      region_name: res.regionName,
      city: res.city,
      zip_code: res.zip,
      time_zone: res.timezone,
      latitude: res.lat,
      longitude: res.lon,
    };
  },

  init: function (settings) {
    this.settings = settings;
    this.redirect = localStorage.getItem("location-redirect");

    // Only relevant if force_redirect is false - start:
    this.messageWrap = document.querySelector(
      "#location-redirect-message,#location-redirect-popup"
    );
    this.currentCountry = this.messageWrap?.querySelector(".current-country");
    this.RedirectMe = this.messageWrap?.querySelector(".redirect-me");
    this.closeBtn = this.messageWrap?.querySelector(".close-redirect-btn");
    this.newStore = this.messageWrap?.querySelector(".new-store");
    // this.featherlight = $.featherlight;
    // Only relevant if force_redirect is false - end.

    this.catchAllCountries = settings["redirect_catch_all_countries"];
    this.catchAllURL = settings["redirect_catch_all_url"];
    this.catchAllName = settings["redirect_catch_all_name"];

    this.forceRedirect = true; // true
    this.relativeRedirect = true; // true
    this.countryTranslations = {
      Sweden: "Sverige",
    };
    this.domain = "https://pro.ip-api.com/json/?key=Al1ypmP0brXQljZ";
    this.redirects = [];
    this.urlMap = {};
    this.location = {};

    // This pushes any non-catch-all redirects into the redirects stack. We don't use any.
    // Redirects should look [settings["redirect_1"], ... ] evaluating to urls.
    this.loadRedirects(settings);

    // This splits the redirects, pushes objects for each one, and pushes the catch-alls at the end.
    this.mapURLs(this.redirects, "::");

    this.redirect =
      typeof this.redirect == "string"
        ? JSON.parse(this.redirect)
        : { shown: false, date: null };
    this.redirect.shown = this.getIsRedirectShown();

    // Initialization successful
    return true;
  },

  run: function () {
    // We only use forceRedirect, so this is true.
    const successCallback = this.forceRedirect
      ? this.fetchAndRedirectOnResponse
      : this.fetchAndShowRedirect;

    // Again, this will be true always since forceRedirect is true;
    const activateRedirect =
      !this.redirect.shown || this.forceRedirect ? true : false;

    if (activateRedirect) {
      this.makeServerCall(
        this.fetchLocationInfoAndRunCallback,
        successCallback
      );

      if (!this.forceRedirect) this.bindRedirect();
    }
  },

  loadRedirects: function (settings) {
    // This is querying at the top level of settings_config. There are no redirect_1 entries here...
    for (var i = 1; i < 11; ++i) {
      const name = "redirect_" + i;
      this.redirects.push(settings[name]);
    }
  },

  mapURLs: function (stringList, splitter) {
    for (var i = 0; i < stringList.length; ++i) {
      if (stringList[i] && stringList[i] != "") {
        var splitString = stringList[i].split(splitter);

        if (
          splitString[2].indexOf("http://") === -1 &&
          splitString[1].indexOf("https://") === -1
        ) {
          splitString[2] = "http://" + splitString[2];
        }

        this.urlMap[splitString[0]] = {
          name: splitString[1],
          url: splitString[2],
        };
      }
    }

    if (this.catchAllCountries.length > 0) {
      var countries = this.catchAllCountries.split(/[\s,]+/);

      for (var i = 0; i < countries.length; ++i) {
        this.urlMap[countries[i]] = {
          name: this.catchAllName,
          url: this.catchAllURL,
        };
      }
    }

    // pointless return?
    return this.urlMap;
  },

  getIsRedirectShown: function () {
    var self = this,
      today = new Date(),
      prevDate = new Date(self.redirect.date),
      dayLength = 1000 * 24 * 60 * 60, // in milliseconds
      diffDate = today - prevDate;

    // display query again if localStorage is older than 30 days
    if (diffDate / dayLength > 30) return false;

    return true;
  },

  makeServerCall: function (serverCall, callback) {
    return serverCall(callback);
  },

  fetchLocationInfoAndRunCallback: function (successCallback) {
    var self = IPRedirect;

    fetch(self.domain, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        successCallback(self.adapter(data));
      })
      .catch((error) => {
        console.error("[IPRedirect] Did not run due to an error.", error);
      });
  },

  fetchAndShowRedirect: function (location) {
    var self = IPRedirect;

    self.location = location;

    if (self.urlMap[location.country_code].url != null) {
      var countryName = self.countryTranslations[location.country_name]
        ? self.countryTranslations[location.country_name]
        : location.country_name;

      self.currentCountry.text(countryName);
      self.newStore.text(self.urlMap[location.country_code].name);
      if (self.relativeRedirect) {
        self.RedirectMe.attr(
          "href",
          self.urlMap[location.country_code].url + window.location.pathname
        );
      } else {
        self.RedirectMe.attr("href", self.urlMap[location.country_code].url);
      }
      if (self.settings.redirect_popup) {
        self.featherlight($("#location-redirect-popup"), {
          afterClose: function (event) {
            self.saveRedirect();
          },
        });
      } else {
        self.messageWrap.show();
      }
    }
  },

  fetchAndRedirectOnResponse: function (location) {
    var self = IPRedirect;

    self.location = location;

    if (self.urlMap[location.country_code] == null) {
      console.log(
        "[IPRedirect]: no redirect specified for",
        location.country_code,
        "country code."
      );
      return;
    }

    if (self.urlMap[location.country_code].url != null) {
      if (self.relativeRedirect) {
        var params = new URLSearchParams(window.location.search);
        params.set("utm_source", "vitaly-com-redirect");
        var paramString = params.toString();
        var newSearch = paramString !== "" ? "?" + paramString : "";
        window.location.assign(
          self.urlMap[location.country_code].url +
            window.location.pathname +
            newSearch
        );
      } else {
        window.location.assign(
          self.urlMap[location.country_code].url +
            "?utm_source=vitaly-com-redirect"
        );
      }
    }
  },

  bindRedirect: function () {
    var self = this;

    // only save to local storage if the user doesn't want to be redirected.
    self.closeBtn.off().on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      self.messageWrap.hide();
      self.featherlight.close();
      self.saveRedirect();
    });

    self.RedirectMe.on("click", function (e) {
      e.stopPropagation();
    });
  },

  saveRedirect: function (key, val) {
    var redirect = {
      shown: true,
      date: Date(),
    };
    localStorage.setItem("location-redirect", JSON.stringify(redirect));
  },
};
