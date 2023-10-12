import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { Rule } from "../def";

const Messages = findByProps("sendMessage", "receiveMessage");

const Warning = getAssetIDByName("ic_warning_24px");

export default function patchSendMessage() {
	return before("sendMessage", Messages, (args) => {
		// Rules, but filtering out ones with empty match arguments
		const rules = (storage.rules as Rule[]).filter((rule) => rule.match);
		// The message content
		let content = args[1].content as string;

		// Go through each rule and run the message through it
		for (const rule of rules) {
			// If the rule is a regular expression, do regex logic
			if (rule.regex) {
				try {
					// Create regexp
					const pattern = new RegExp(rule.match, rule.flags)
					// Replace
					//content = content.replace(pattern, rule.replace);
					//Old replace was just naive string replace, we want to check for $1 meaning insert the match
					//first extract match
					const match = content.match(pattern);
					//if there is a match, and replace string contains $1, replace $1 with match, then replace content with new string
					if (match && rule.replace.includes("$1")) {
						content = content.replace(pattern ,rule.replace.replace("\\$1", match[0]));
						showToast('Detected variable',Warning)
					} else {
						//if there is no match, or replace string does not contain $1, just replace content with new string
						content = content.replace(pattern, rule.replace);
					}
				} catch (e) {
					// Log error
					console.log(e)
					// Notify user
					showToast(`Failed to use RegExp for ${rule.name}!`, Warning)
					continue
				}
			} else {
				// Normal logic
				content = content.replaceAll(rule.match, rule.replace);
			}
		};

		// Update message content with the updated content
		args[1].content = content;
	});
};
