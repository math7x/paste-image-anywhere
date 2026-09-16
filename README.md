# Paste Image Anywhere

Extensão que permite colar imagens da área de transferência diretamente em campos de upload que normalmente aceitam apenas seleção de arquivo.

## Como funciona

A extensão captura o evento de colagem, converte a imagem da área de transferência em um objeto `File` e o associa ao campo de upload da página. O fluxo preserva os eventos esperados pelo formulário para que a aplicação reconheça o arquivo.

## Recursos

- atalho padrão `Ctrl+V`;
- detecção de campos de upload compatíveis;
- integração com aplicações web específicas;
- interface simples para indicar o estado da extensão.

## Instalação

1. Abra `chrome://extensions` ou `brave://extensions`.
2. Ative o modo do desenvolvedor.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta deste projeto.

Tecnologias principais: JavaScript, Clipboard API, File API e Chrome Extensions API.
