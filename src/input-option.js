import _ from 'lodash'

function regexSplit (str) {
  return str.split('').map(function (char) {
    return char.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
  })
}

export default class InputOption {
  constructor(options) {
    this.fuzzy = options.fuzzy || 'none'
    this.text = options.text || ''
    this.match = options.match || []
    this.suggestion = options.suggestion || []
    this.completion = options.completion || []
    this.result = options.result || {}
    this.stack = options.stack || []
    this.limit = options.limit || {}
    this.sentence = options.sentence
  }

  getData() {
    return {
      fuzzy: this.fuzzy,
      text: this.text,
      match: this.match,
      suggestion: this.suggestion,
      completion: this.completion,
      result: this.result,
      stack: this.stack,
      limit: this.limit,
      sentence: this.sentence
    }
  }

  addLimit(phraseParseId, number) {
    var newLimit = _.clone(this.limit)
    newLimit[phraseParseId] = number
    return newLimit
  }

  stackPush(element) {
    return this.stack.concat(element)
  }

  stackPop() {
    return this.stack.slice(0, -1)
  }

  fuzzyMatch(text, string, category) {
    var i, l
    var suggestions = []
    var fuzzyString = '^(.*?)(' + regexSplit(text).join(')(.*?)(') + ')(.*?$)'
    var fuzzyRegex = new RegExp(fuzzyString, 'i')
    var fuzzyMatches = string.match(fuzzyRegex)
    if (fuzzyMatches) {
      for (i = 1, l = fuzzyMatches.length; i < l; i++) {
        if (fuzzyMatches[i].length > 0) {
          suggestions.push({
            string: fuzzyMatches[i],
            category: category,
            input: i % 2 === 0
          })
        }
      }
      return {suggestion: suggestions, text: this.text.substring(text.length)}
    }
    return null
  }

  getActualFuzzy(fuzzyOverride) {
    if (this.fuzzy === 'none' || fuzzyOverride === 'none') {
      return 'none'
    } else if (this.fuzzy === 'phrase' || fuzzyOverride === 'phrase') {
      return 'phrase'
    } else {
      return 'all'
    }
  }

  matchString(string, options) {
    var i, substring
    var result
    var actualFuzzy = this.getActualFuzzy(options.fuzzy)

    if (actualFuzzy === 'all') {
      for (i = Math.min(this.text.length, string.length); i > 0; i--) {
        substring = this.text.slice(0, i)
        result = this.fuzzyMatch(substring, string, options.category)
        if (result) {
          return result
        }
      }

      // if there are no fuzzy matches
      return {
        suggestion: [{string: string, category: options.category, input: false}],
        text: this.text
      }
    } else if (actualFuzzy === 'phrase') {
      return this.fuzzyMatch(this.text, string, options.category)
    } else {
      if (_.startsWith(string.toLowerCase(), this.text.toLowerCase())) {
        return {
          suggestion: [
            {string: string.substring(0, this.text.length), category: options.category, input: true},
            {string: string.substring(this.text.length), category: options.category, input: false}
          ],
          text: this.text.substring(string.length)
        }
      } else {
        return null
      }
    }
  }

  handleString(string, options) {
    var newOptions = _.clone(this)
    var newWord = {
      string: string,
      category: options.category
    }
    var matches

    // If the text is complete
    if (this.text.length === 0) {
      if (
        (this.suggestion.length === 0) || // no suggestion
        (this.completion.length === 0 && options.join) // no completion, and this is join
      ) {
        newWord.input = false
        newOptions.suggestion = this.suggestion.concat(newWord)

      // There is a suggestion
      } else {
        // This is part of the completion
        newOptions.completion = this.completion.concat(newWord)
      }

    // The text is not complete - this is a part of the text
    } else {
      // If the provided string is fully consumed by this.text
      if (this.suggestion.length === 0 && _.startsWith(this.text.toLowerCase(), string.toLowerCase())) {
        // it's a match
        newOptions.match = this.match.concat(newWord)
        newOptions.text = this.text.substring(string.length)
      // the provided string is not fully consumed - it may be a suggestion
      } else {
        matches = this.matchString(string, options)
        if (matches) {
          newOptions.suggestion = this.suggestion.concat(matches.suggestion)
          newOptions.text = matches.text
        } else {
          return null
        }
      }
    }
    return newOptions
    // return new InputOption(newOptions)
  }
}