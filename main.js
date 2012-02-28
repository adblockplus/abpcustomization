/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

Cu.import("resource://gre/modules/Services.jsm");

let {Prefs} = require("prefs");
let {WindowObserver} = require("windowObserver");

var WindowFeature =
{
  observer: null,

  init: function()
  {
    if (!this.observer)
      this.observer = new WindowObserver(this, "ready");
  },

  shutdown: function()
  {
    if (this.observer)
      this.observer.shutdown();
    this.observer = null;
  },

  applyToWindow: function(window)
  {
    if (window.location.href != this.windowUrl)
      return;
    this._applyToWindow(window);
  },

  removeFromWindow: function(window)
  {
    if (window.location.href != this.windowUrl)
      return;
    this._removeFromWindow(window);
  }
}

var VerticalPreferencesLayout =
{
  __proto__: WindowFeature,
  windowUrl: "chrome://adblockplus/content/ui/filters.xul",

  _applyToWindow: function(window)
  {
    let content = window.document.getElementById("content");
    let splitter = window.document.getElementById("filtersSplitter");
    if (!content || !splitter)
      return;

    content.setAttribute("orient", "vertical");
    splitter.setAttribute("orient", "vertical");
  },

  _removeFromWindow: function(window)
  {
    let content = window.document.getElementById("content");
    let splitter = window.document.getElementById("filtersSplitter");
    if (!content || !splitter)
      return;

    content.removeAttribute("orient");
    splitter.setAttribute("orient", "horizontal");
  }
};

var OneLineSubscriptions =
{
  __proto__: WindowFeature,
  windowUrl: "chrome://adblockplus/content/ui/filters.xul",

  _applyToWindow: function(window)
  {
    let list = window.document.getElementById("subscriptions");
    let template = window.document.getElementById("subscriptionTemplate");
    if (!list || !template || !("Templater" in window))
      return;

    let vbox = template.firstChild;
    if (!vbox || vbox.localName != "vbox")
      return;

    let hbox1 = vbox.firstChild;
    if (!hbox1 || hbox1.localName != "hbox")
      return;

    let hbox2 = hbox1.nextSibling;
    if (!hbox2 || hbox2.localName != "hbox")
      return;

    let checkboxes = hbox1.getElementsByTagName("checkbox");
    let insertionPoint = (checkboxes.length && checkboxes[0].parentNode == hbox1 ? checkboxes[0] : null);
    while (hbox2.firstChild)
    {
      hbox2.firstChild.classList.add("movedByCustomization");
      hbox1.insertBefore(hbox2.firstChild, insertionPoint);
    }

    for (let child = list.firstChild; child; child = child.nextSibling)
      window.Templater.update(template, child);
  },

  _removeFromWindow: function(window)
  {
    let list = window.document.getElementById("subscriptions");
    let template = window.document.getElementById("subscriptionTemplate");
    if (!list || !template || !("Templater" in window))
      return;

    let vbox = template.firstChild;
    if (!vbox || vbox.localName != "vbox")
      return;

    let hbox1 = vbox.firstChild;
    if (!hbox1 || hbox1.localName != "hbox")
      return;

    let hbox2 = hbox1.nextSibling;
    if (!hbox2 || hbox2.localName != "hbox")
      return;

    let moved = [].slice.call(hbox1.getElementsByClassName("movedByCustomization"));
    for (let i = 0; i < moved.length; i++)
    {
      moved[i].classList.remove("movedByCustomization");
      hbox2.appendChild(moved[i]);
    }

    for (let child = list.firstChild; child; child = child.nextSibling)
      window.Templater.update(template, child);
  }
};

var StylesheetFeature =
{
  uri: null,
  stylesheetService: Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),

  init: function()
  {
    let stylesheet = this.stylesheet;
    if (this.uri && this.uri.spec == stylesheet)
      return;

    this.shutdown();

    this.uri = Services.io.newURI(stylesheet, null, null);
    this.stylesheetService.loadAndRegisterSheet(
      this.uri,
      Ci.nsIStyleSheetService.USER_SHEET
    );

    this.shutdown = this.shutdown.bind(this);
    onShutdown.add(this.shutdown);
  },

  shutdown: function()
  {
    if (!this.uri)
      return;

    this.stylesheetService.unregisterSheet(
      this.uri,
      Ci.nsIStyleSheetService.USER_SHEET
    );
    this.uri = null;
    onShutdown.remove(this.shutdown);
  }
};

var AddonPageStyles =
{
  __proto__: StylesheetFeature,
  stylesheet: "chrome://abpcustomization/content/addonPageStyles.css"
};

var RemoveCheckboxLabel =
{
  __proto__: StylesheetFeature,
  stylesheet: "chrome://abpcustomization/content/noCheckboxLabel.css"
};

var RemoveActionsButton =
{
  __proto__: StylesheetFeature,
  stylesheet: "chrome://abpcustomization/content/noActionButton.css"
};

var BoldTitles =
{
  __proto__: StylesheetFeature,
  stylesheet: "chrome://abpcustomization/content/boldTitles.css"
};

var NoItalics =
{
  __proto__: StylesheetFeature,
  stylesheet: "chrome://abpcustomization/content/noItalics.css"
};

var ToolbarIconDisplay =
{
  __proto__: StylesheetFeature,
  get template()
  {
    let request = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIJSXMLHttpRequest);
    request.open("GET", "chrome://abpcustomization/content/toolbarIconDisplay.css", false);
    request.overrideMimeType("text/plain");
    request.send();
    let result = request.responseText;

    delete this.template;
    this.__defineGetter__("template", function() result);

    return this.template;
  },
  get stylesheet()
  {
    const DISPLAY_IMAGE = 1;
    const DISPLAY_TEXT = 2;
    let type = Prefs["toolbar-icon-display"];

    let styles = this.template;
    styles = styles.replace(/%%IMAGE_DISPLAY%%/gi, (type & DISPLAY_IMAGE) ? "-moz-box" : "none");
    styles = styles.replace(/%%TEXT_DISPLAY%%/gi, (type & DISPLAY_TEXT) ? "-moz-box" : "none");
    return "data:text/css;charset=utf-8," + encodeURIComponent(styles);
  }
};

var GreenIcon =
{
  __proto__: StylesheetFeature,
  stylesheet: "chrome://abpcustomization/content/greenToolbarIcon.css"
}

var RemoveMenus =
{
  __proto__: StylesheetFeature,
  stylesheet: "chrome://abpcustomization/content/hideMenus.css"
};

let features =
{
  "addon-page-styles": AddonPageStyles,
  "vertical-preferences-layout": VerticalPreferencesLayout,
  "preferences-one-line-subscriptions": OneLineSubscriptions,
  "preferences-remove-checkbox-label": RemoveCheckboxLabel,
  "preferences-remove-actions-button": RemoveActionsButton,
  "preferences-bold-titles": BoldTitles,
  "preferences-no-italics": NoItalics,
  "toolbar-icon-display": ToolbarIconDisplay,
  "green-icon": GreenIcon,
  "remove-menus": RemoveMenus
};

function updateFeature(name)
{
  if (name in features)
  {
    let enabled;
    if (name == "addon-page-styles")
      enabled = true;
    else
      enabled = Prefs[name];

    if (enabled)
      features[name].init();
    else
      features[name].shutdown();
  }
}


// Initialize features and make sure to update them on changes
for (let feature in features)
  updateFeature(feature);

Prefs.addListener(updateFeature);
