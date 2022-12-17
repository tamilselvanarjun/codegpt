export function undefinedIfEmpty(str: string | undefined) {
  return (str ?? "").length > 0 ? str : undefined;
}

export function createPrompt(
  userInput?: string,
  preset?: string,
  currentSelection?: string,
  currentBuffer?: string
): string {
  if (preset) {
    return preset + "\n" + (userInput ?? currentSelection ?? currentBuffer ?? "");
  }
  // If preset is not set, return selection + userInput or just user input if no selection
  else {
    // (textarea can be empty - like for an error message)
    if (currentSelection) {
      return `${currentSelection}

    ${userInput}`;
    } else {
      // We don't allow current buffer because otherwise, there would be no way to do just
      // do prompts directly like "Generate a discord bot that tells funny jokes"
      // TODO: Check out OG demo to see what they do
      return userInput ?? "";
    }
  }
  return "";
}
