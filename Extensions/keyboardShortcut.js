//@ts-check

// NAME: Keyboard Shortcut
// AUTHOR: khanhas
// DESCRIPTION: Register a few more keybinds to support keyboard-driven navigation in Spotify client.

/// <reference path="../globals.d.ts" />

(function KeyboardShortcut() {
    if (!Spicetify.Keyboard) {
        setTimeout(KeyboardShortcut, 1000);
        return;
    }

    /*
     * Syntax:
     *     registerBind(keyName, ctrl, shift, alt, callback)
     *     See `Keyboard` in global.ts.d for key definitions
     *     NOTE: ALL LETTERS ARE GIVEN IN CAPITAL FORM
     */
    const SCROLL_STEP = 300;
    const PAGE_STEP = 1000;

    // https://github.com/khanhas/spicetify-cli/pull/1424
    const increaseVolume = () => Spicetify.Platform?.PlaybackAPI.raiseVolume();
    const decreaseVolume = () => Spicetify.Platform?.PlaybackAPI.lowerVolume();

    const clickSelector = (selector) => document.querySelector(selector).click();
    const getMainContainer = () => document.querySelector(".Root__main-view .os-viewport");
    const skipForward = () => Spicetify.Player.skipForward(10 * 1000);
    const skipBack = () => Spicetify.Player.skipBack(10 * 1000);

    // 'P' and 'I' to go back and forward page
    registerBind("P", false, false, false, clickSelector, ".main-topBar-button[aria-label='Go back']");
    registerBind("I", false, false, false, clickSelector, ".main-topBar-button[aria-label='Go forward']");

    //  Down/Up J/D and K/U for vertical scrolling
    registerBind("J", false, false, false, appScroll, SCROLL_STEP);
    registerBind("D", false, false, false, appScroll, PAGE_STEP);

    registerBind("K", false, false, false, appScroll, -SCROLL_STEP);
    registerBind("U", false, false, false, appScroll, -PAGE_STEP);

    // g and G to scroll to top and to bottom
    registerBind("G", false, false, false, appScrollTop, null);
    registerBind("G", false, true, false, appScrollBottom, null);

    // / to open search page
    registerBind("/", false, false, false, openSearchPage, null);

    // F to full-screen
    registerBind("F", false, true, false, clickSelector, ".main-topBar-button[title='Full App Display']");

    // H|L to skip backward/forward 10s
    registerBind("H", false, true, false, skipBack, null);
    registerBind("L", false, true, false, skipForward, null);

    // Shift + Arrow Left Next and Shift + Arrow Right  Previous Song
    registerBind("ARROW_RIGHT", false, true, false, clickSelector, ".main-skipForwardButton-button");
    registerBind("ARROW_LEFT", false, true, false, clickSelector, ".main-skipBackButton-button");

    // Shift + Arrow Up Increase Volume Shift + Arrow Down Decrease Volume
    registerBind("ARROW_UP", false, true, false, increaseVolume, null);
    registerBind("ARROW_DOWN", false, true, false, decreaseVolume, null);

    // Go to Home or Library
    registerBind("M", false, false, false, clickSelector, ".main-navBar-navBarItem[data-id='/'] a");
    registerBind("M", false, true, false, clickSelector, ".main-navBar-navBarItem[data-id='/collection'] a");

    // Go to specific playlist and automatically start playing them
    registerBind("Z", false, false, false, goToPlaylist, "⽉");
    registerBind("Z", false, true, false, goToPlaylist, "🌗");

    // TODO:
    registerBind("Q", false, true, false, goToAlbumOfCurrentTrack, null);
    registerBind("W", false, false, false, focusPlaylist, null);

    // ':', '.' or 'F' to show keyboard combinations for clicking elements
    // Esc to cancel
    const vim = new VimBind();
    registerBind(".", false, false, false, vim.activate.bind(vim), null);
    registerBind(":", false, true, false, vim.activate.bind(vim), null);
    registerBind("F", false, false, false, vim.activate.bind(vim), null);
    vim.setCancelKey("ESCAPE");

    function goToPlaylist(name) {
        document.querySelectorAll(".standalone-ellipsis-one-line.main-rootlist-rootlistItemLink").forEach((anchor) => {
            if (anchor.querySelector("span").innerText == name) {
                anchor.click();
                // Start playing based on the playlist ID in the href attribute
                const playlist_id = anchor.href.substr(anchor.href.lastIndexOf("/") + 1);
                Spicetify.Player.playUri(`spotify:playlist:${playlist_id}`, {}, {});
            }
        });
    }

    function focusPlaylist() {
        // TODO: Focus current song in playlist
    }

    function goToAlbumOfCurrentTrack() {
        // TODO: Or we can just double click the bottom left icon
        console.log(Spicetify.Player.data.track.metadata.album_uri);
    }

    function fullTextSearch() {
        // TODO
        console.log("/");
    }

    function appScroll(step) {
        const app = getMainContainer();
        if (app) {
            app.scrollBy(0, step);
        }
    }

    function appScrollBottom() {
        const app = getMainContainer();
        app.scroll(0, app.scrollHeight);
    }

    function appScrollTop() {
        const app = getMainContainer();
        app.scroll(0, 0);
    }

    /**
     *
     * @param {KeyboardEvent} event
     */
    function openSearchPage(event) {
        const searchInput = document.querySelector(".main-topBar-container input");
        if (searchInput) {
            // @ts-ignore
            searchInput.focus();
        } else {
            const sidebarItem = document.querySelector(`.main-navBar-navBar a[href="/search"]`);
            if (sidebarItem) {
                // @ts-ignore
                sidebarItem.click();
            }
        }

        event.preventDefault();
    }

    /**
     *
     * @param {Spicetify.Keyboard.ValidKey} keyName
     * @param {boolean} ctrl
     * @param {boolean} shift
     * @param {boolean} alt
     * @param {(event: KeyboardEvent) => void} callback
     */
    function registerBind(keyName, ctrl, shift, alt, callback, arg) {
        const key = Spicetify.Keyboard.KEYS[keyName];

        Spicetify.Keyboard.registerShortcut(
            {
                key,
                ctrl,
                shift,
                alt,
            },
            (event) => {
                if (!vim.isActive) {
                    callback(arg);
                }
            }
        );
    }

    /**
     * @returns {number}
     */
    function findActiveIndex(allItems) {
        const active = document.querySelector(
            ".main-navBar-navBarLinkActive, .main-collectionLinkButton-selected, .main-rootlist-rootlistItemLinkActive"
        );
        if (!active) {
            return -1;
        }

        let index = 0;
        for (const item of allItems) {
            if (item === active) {
                return index;
            }

            index++;
        }
    }

    /**
     *
     * @param {1 | -1} direction
     */
    function rotateSidebar(direction) {
        const allItems = document.querySelectorAll(
            ".main-navBar-navBarLink, .main-collectionLinkButton-collectionLinkButton, .main-rootlist-rootlistItemLink"
        );
        const maxIndex = allItems.length - 1;
        let index = findActiveIndex(allItems) + direction;

        if (index < 0) index = maxIndex;
        else if (index > maxIndex) index = 0;

        let toClick = allItems[index];
        if (!toClick.hasAttribute("href")) {
            toClick = toClick.querySelector(".main-rootlist-rootlistItemLink");
        }

        // @ts-ignore
        toClick.click();
    }
})();

function VimBind() {
    const elementQuery = ["[href]", "button", "td.tl-play", "td.tl-number", "tr.TableRow"].join(",");

    const keyList = "qwertasdfgzxcvyuiophjklbnm".split("");

    const lastKeyIndex = keyList.length - 1;

    this.isActive = false;

    const vimOverlay = document.createElement("div");
    vimOverlay.id = "vim-overlay";
    vimOverlay.style.zIndex = "9999";
    vimOverlay.style.position = "absolute";
    vimOverlay.style.width = "100%";
    vimOverlay.style.height = "100%";
    vimOverlay.style.display = "none";
    vimOverlay.innerHTML = `<style>
.vim-key {
	position: fixed;
	padding: 3px 6px;
	background-color: black;
	border-radius: 3px;
	border: solid 2px white;
	color: white;
	text-transform: lowercase;
	line-height: normal;
	font-size: 14px;
	font-weight: 500;
}
</style>`;
    document.body.append(vimOverlay);

    const mousetrap = new Spicetify.Mousetrap(document);
    mousetrap.bind(keyList, listenToKeys.bind(this), "keypress");
    // Pause mousetrap event emitter
    const orgStopCallback = mousetrap.stopCallback;
    mousetrap.stopCallback = () => true;

    /**
     *
     * @param {KeyboardEvent} event
     */
    this.activate = function (event) {
        vimOverlay.style.display = "block";

        const vimkey = getVims();
        if (vimkey.length > 0) {
            vimkey.forEach((e) => e.remove());
            return;
        }

        let firstKey = 0;
        let secondKey = 0;

        getLinks().forEach((e) => {
            // @ts-ignore
            if (e.style.display === "none" || e.style.visibility === "hidden" || e.style.opacity === "0") {
                return;
            }

            const bound = e.getBoundingClientRect();
            let owner = document.body;

            let top = bound.top;
            let left = bound.left;

            if (
                bound.bottom > owner.clientHeight ||
                bound.left > owner.clientWidth ||
                bound.right < 0 ||
                bound.top < 0 ||
                bound.width === 0 ||
                bound.height === 0
            ) {
                return;
            }

            vimOverlay.append(createKey(e, keyList[firstKey] + keyList[secondKey], top, left));

            secondKey++;
            if (secondKey > lastKeyIndex) {
                secondKey = 0;
                firstKey++;
            }
        });

        this.isActive = true;
        setTimeout(() => (mousetrap.stopCallback = orgStopCallback.bind(mousetrap)), 100);
    };

    /**
     *
     * @param {KeyboardEvent} event
     */
    this.deactivate = function (event) {
        mousetrap.stopCallback = () => true;
        this.isActive = false;
        vimOverlay.style.display = "none";
        getVims().forEach((e) => e.remove());
    };

    function getLinks() {
        const elements = Array.from(document.querySelectorAll(elementQuery));
        return elements;
    }

    function getVims() {
        return Array.from(vimOverlay.getElementsByClassName("vim-key"));
    }

    /**
     * @param {KeyboardEvent} event
     */
    function listenToKeys(event) {
        if (!this.isActive) {
            return;
        }

        const vimkey = getVims();

        if (vimkey.length === 0) {
            this.deactivate(event);
            return;
        }

        for (const div of vimkey) {
            // @ts-ignore
            const text = div.innerText.toLowerCase();
            if (text[0] !== event.key) {
                div.remove();
                continue;
            }

            const newText = text.slice(1);
            if (newText.length === 0) {
                // @ts-ignore
                click(div.target);
                this.deactivate(event);
                return;
            }

            // @ts-ignore
            div.innerText = newText;
        }

        if (vimOverlay.childNodes.length === 1) {
            this.deactivate(event);
        }
    }

    function click(element) {
        if (element.hasAttribute("href") || element.tagName === "BUTTON") {
            element.click();
            return;
        }

        const findButton = element.querySelector(`button[data-ta-id="play-button"]`) || element.querySelector(`button[data-button="play"]`);
        if (findButton) {
            findButton.click();
            return;
        }
        alert("Let me know where you found this button, please. I can't click this for you without that information.");
        return;
        // TableCell case where play button is hidden
        // Index number is in first column
        const index = parseInt(element.firstChild.innerText) - 1;
        const context = getContextUri();
        if (index >= 0 && context) {
            console.log(index);
            console.log(context);

            //Spicetify.PlaybackControl.playFromResolver(context, { index }, () => {});
            return;
        }
    }

    function createKey(target, key, top, left) {
        const div = document.createElement("span");
        div.classList.add("vim-key");
        div.innerText = key;
        div.style.top = top + "px";
        div.style.left = left + "px"; // @ts-ignore
        div.target = target;
        return div;
    }

    function getContextUri() {
        const username = __spotify.username;
        const activeApp = localStorage.getItem(username + ":activeApp");
        if (activeApp) {
            try {
                return JSON.parse(activeApp).uri.replace("app:", "");
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     *
     * @param {Spicetify.Keyboard.ValidKey} key
     */
    this.setCancelKey = function (key) {
        mousetrap.bind(Spicetify.Keyboard.KEYS[key], this.deactivate.bind(this));
    };

    return this;
}
