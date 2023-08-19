import { parse as htmlParser } from 'node-html-parser';

const parse = (content, removeWhitespaces = false) => {
    if (removeWhitespaces) {
        content = content.replace(/\n/, '').replace(/>(\s+)</g, '><');
    }

    return htmlParser(content);
};

const findInnerContentByClass = (html, classToSearch) => {
    if (!html) {
        throw new Error('html cannot be empty');
    }

    if (!classToSearch) {
        throw new Error('classToSearch cannot be empty');
    }

    const find = (_html, _classToSearch) => {
        if (_html.classList && _html.classList.contains(_classToSearch)) {
            return _html.innerText;
        }

        
    }



}

const getChildNodesByType = (html, type) => {
    if (!html) {
        throw new Error('html cannot be empty');
    }

    if (!type) {
        throw new Error('type cannot be empty');
    }

    if (!html.childNodes || html.childNodes.length == 0) {
        return [];
    }

    return html.childNodes.find((child) => child.rawTagName == type);
}

export { parse, getChildNodesByType }