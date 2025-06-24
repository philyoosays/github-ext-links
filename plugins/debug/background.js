
ON_MESSAGE.printBGState = async (message, sender, sendResponse) => {
    if (message.action !== 'printBGState') return
    console.log(STATE)
    sendResponse({ success: true });
};
