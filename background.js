// background.js

/**
 * Initialize the extension by creating the context menu.
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log("Scroll Position Marker Extension Installed.");

  // Create context menu item for "Mark It"
  chrome.contextMenus.create(
    {
      id: "mark-it",
      title: "Mark It!",
      contexts: ["all"]
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error creating context menu:", chrome.runtime.lastError);
      } else {
        console.log("Context menu item 'Mark It' created.");
      }
    }
  );

  chrome.contextMenus.create(
    {
      id: "navigate-to-it",
      title: "Navigated to It!",
      contexts: ["all"]
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error creating context menu:", chrome.runtime.lastError);
      } else {
        console.log("Context menu item 'Navigated to It!' created.");
      }
    }
  );
});

/**
 * Listen for context menu clicks.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "mark-it") {
    console.log("'Mark It' context menu clicked.");

    if (tab.id && tab.url.startsWith("http")) {
      // Execute a script to get the current scroll position
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: getScrollPosition
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error("Script injection failed:", chrome.runtime.lastError.message);
            createNotification("Error", "Failed to mark scroll position.");
            return;
          }

          if (
            injectionResults &&
            injectionResults[0] &&
            typeof injectionResults[0].result === "number"
          ) {
            const scrollY = injectionResults[0].result;
            const key = tab.url;

            // Save the scroll position in storage
            chrome.storage.local.set({ [key]: scrollY }, () => {
              if (chrome.runtime.lastError) {
                console.error("Error saving scroll position:", chrome.runtime.lastError);
                createNotification("Error", "Failed to save scroll position.");
              } else {
                console.log(`Scroll position (${scrollY}) saved for URL: ${key}`);
                createNotification("Success", "Scroll position saved!");
              }
            });
          } else {
            console.error("Unexpected result from injected script.");
            createNotification("Error", "Failed to retrieve scroll position.");
          }
        }
      );
    } else {
      createNotification("Error", "Cannot mark scroll position on this page.");
    }
  } else if (info.menuItemId === "navigate-to-it") {
    console.log("'Navigated to It!' context menu clicked.");

    if (tab.id && tab.url.startsWith("http")) {
      chrome.storage.local.get([tab.url], (result) => {
        if (chrome.runtime.lastError) {
          console.error("Error retrieving scroll position:", chrome.runtime.lastError);
          createNotification("Error", "Failed to retrieve scroll position.");
          return;
        }

        const savedScrollY = result[tab.url];

        if (typeof savedScrollY !== "number") {
          createNotification("Error", "No saved scroll position for this page.");
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: scrollToPosition,
            args: [savedScrollY]
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error("Script injection failed:", chrome.runtime.lastError.message);
              createNotification("Error", "Failed to navigate to scroll position.");
            } else {
              console.log(`Scrolled to position: ${savedScrollY}`);
            }
          }
        );
      });
    } else {
      createNotification("Error", "Cannot navigate to mark on this page.");
    }
  }
});

/**
 * Function to retrieve the current vertical scroll position.
 * This function is executed within the context of the webpage.
 * @returns {number} The current vertical scroll position.
 */
function getScrollPosition() {
  return window.scrollY;
}

/**
 * Function to scroll the window to a specific vertical position.
 * This function is executed within the context of the webpage.
 * @param {number} scrollY - The vertical scroll position to navigate to.
 */
function scrollToPosition(scrollY) {
  window.scrollTo(0, scrollY);
}

/**
 * Function to create and display a notification.
 * @param {string} title - The title of the notification.
 * @param {string} message - The message body of the notification.
 */
function createNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: title,
    message: message
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error("Notification creation failed:", chrome.runtime.lastError);
    } else {
      console.log(`Notification (${notificationId}) created: ${title} - ${message}`);
    }
  });
}
