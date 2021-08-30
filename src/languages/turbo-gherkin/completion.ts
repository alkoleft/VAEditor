import { getLineMaxColumn, getLineMinColumn, IWorkerContext } from './common';

function empty(lineNumber: number, column: number) {
  return {
    suggestions: [{
      label: '',
      insertText: '',
      kind: monaco.languages.CompletionItemKind.Function,
      range: {
        startLineNumber: lineNumber,
        endLineNumber: lineNumber,
        startColumn: column - 1,
        endColumn: column,
      },
    }]
  };
}

export function getCompletions(ctx: IWorkerContext, msg: { line: string, lineNumber: number, column: number }) {
  const regexp = /"[^"]*"|'[^']*'|<[^\s"']*>/gi;
  let match, wordRange;
  let variable: string;
  while ((match = regexp.exec(msg.line)) !== null) {
    const startColumn = match.index + 1;
    const endColumn = startColumn + match[0].length;
    if (startColumn <= msg.column && msg.column <= endColumn) {
      variable = match[0];
      wordRange = {
        startLineNumber: msg.lineNumber,
        endLineNumber: msg.lineNumber,
        startColumn: startColumn,
        endColumn: endColumn,
      };
    }
  }
  let result = [];
  if (variable) {
    let Q1 = variable.charAt(0);
    let Q2 = variable.charAt(variable.length - 1);
    let S = /^.\$.+\$.$/.test(variable) ? "$" : "";
    for (let name in ctx.variables) {
      let item = ctx.variables[name];
      result.push({
        label: `"${S}${item.name}${S}" = ${item.value}`,
        filterText: variable + `${S}${item.name}${S}`,
        insertText: `${Q1}${S}${item.name}${S}${Q2}`,
        kind: 4, // monaco.languages.CompletionItemKind.Variable = 4
        range: wordRange
      })
    }
    return result;
  }

  let maxColumn = getLineMaxColumn(msg.line);
  if (maxColumn && msg.column < maxColumn)
    return empty(msg.lineNumber, msg.column);

  let minColumn = getLineMinColumn(msg.line);
  let words = msg.line.match(/[^\s]+/g) || [];
  let keyword = ctx.matcher.findKeyword(words);
  let lineRange = {
    startLineNumber: msg.lineNumber,
    endLineNumber: msg.lineNumber,
    startColumn: minColumn ? minColumn : msg.column,
    endColumn: maxColumn ? maxColumn : msg.column,
  };

  if (keyword) {
    let keytext = keyword.join(' ');
    keytext = keytext.charAt(0).toUpperCase() + keytext.slice(1);
    for (let key in ctx.steplist) {
      let e = ctx.steplist[key];
      if (e.documentation) {
        result.push({
          label: e.label,
          kind: e.kind ? e.kind : 1,
          detail: e.section,
          documentation: e.documentation,
          sortText: e.sortText,
          insertText: keytext + ' ' + e.insertText + '\n',
          filterText: keytext + ' ' + key,
          range: lineRange
        });
      }
    }
  } else {
    ctx.metatags.forEach(word => {
      result.push({
        label: word,
        kind: 17, // monaco.languages.CompletionItemKind.Keyword = 17
        insertText: word + '\n',
        range: lineRange
      });
    });
    for (let key in ctx.steplist) {
      let e = ctx.steplist[key];
      if (e.documentation) {
        result.push({
          label: e.label,
          kind: e.kind ? e.kind : 1,
          detail: e.section,
          documentation: e.documentation,
          sortText: e.sortText,
          insertText: e.keyword + ' ' + e.insertText + '\n',
          filterText: key,
          range: lineRange
        });
      }
    }
  }
  return result;
}
