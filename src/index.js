import * as monaco from 'monaco-editor'

var editor = monaco.editor.create(document.getElementById('container'), {
  value: [
    'function x() {',
    '\tconsole.log("Hello world!");',
    '}'
  ].join('\n'),
  language: 'turbo-gherkin',
  scrollBeyondLastLine: false,
  glyphMargin: true
})

editor.addCommand(monaco.KeyCode.F5, function () {
  V8Proxy.SendAction('F5')
})

editor.deltaDecorations([], [
  {
    range: new monaco.Range(2, 1, 2, 1),
    options: {
      isWholeLine: true,
      className: 'line-selected',
      glyphMarginClassName: 'breakpoint'
    }
  }
])

monaco.languages.register({ id: 'turbo-gherkin' })

monaco.languages.registerHoverProvider('turbo-gherkin', {
  provideHover: function (model, position) {
    return {
      range: model.getFullModelRange(),
      contents: [
        { value: '**DESCRIPTION**' },
        { value: '```html\n' + 'Шаг применяется' + '\n```' }
      ]
    }
  }
})

// 1C:Enterprise interactions.

var V8Proxy = {
  SendAction: function (action, arg) {
    console.debug('SendAction: ' + action + ' : ' + arg)

    var interaction = document.getElementById('interaction')
    interaction.title = action
    interaction.value = arg
    interaction.click()
  },
  OnReceiveAction: function (action, arg) {
    console.debug('OnReceiveAction: ' + action + ' : ' + arg)

    if (action === 'revealLine') {
      editor.revealLine(Number.parseInt(arg))
    }
  }
}

self.OnReceiveAction = V8Proxy.OnReceiveAction // eslint-disable-line no-undef
