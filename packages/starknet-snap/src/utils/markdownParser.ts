
export interface IMarkdownParser {
    apply(text: string): string;
}

export class BoldParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(/(\*\*)(.+?)\1/g, "$2");
        markdown = markdown.replace(/(__)(.+?)\1/g, "$2");
        return markdown
    }
}

export class ItalicizedParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(/(_)(.+?)\1/g, "$2");
        markdown = markdown.replace(/(\*)(.+?)\1/g, "$2");
        return markdown
    }
}

export class StrikeParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(/(~~)(.+?)\1/g, "$2");
        return markdown
    }
}

export class InlineParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(/(`)(.+?)\1/g, '$2');
        return markdown
    }
}

export class CodeParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(RegExp(/```[\s\S]*?```/g, 'm'), '$2');
        return markdown
    }
}

export class LinkParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(/\[(.+?)\]\((.+?)\)/g, '$2');
        return markdown
    }
}

export class ImageParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(/!\[(.+?)\]\((.+?)\)/g, '$2');
        return markdown
    }
}


export class HeadingParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(RegExp(/^#+\s+(.+?)\s*$)/g, 'm'), '$2');
        markdown = markdown.replace(RegExp(/^\s*=+\s*$)/g, 'm'), '$2');
        markdown = markdown.replace(RegExp(/^\s*-+\s*$)/g, 'm'), '$2');
        return markdown
    }
}

export class QuoteParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(RegExp(/^\s*>\s+(.+?)\s*$)/g, 'm'), '$2');
        return markdown
    }
}

export class ListParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(RegExp(/^\s*[\*\+-]\s+(.+?)\s*$)/g, 'm'), '$2');
        markdown = markdown.replace(RegExp(/^\s*\d+\.\s+(.+?)\s*$)/g, 'm'), '$2');
        return markdown
    }
}

export class HrParser implements IMarkdownParser {
    apply(markdown: string): string {
        markdown = markdown.replace(RegExp(/^\s*[-*_]{3,}\s*$)/g, 'm'), '$2');
        return markdown
    }
}

class MarkDownParser {
    private parsers: IMarkdownParser[] = [];
    
    constructor(parsers: IMarkdownParser[]) {
        if(!parsers || parsers.length < 1)
        {
            throw new Error('parsers must be provided');
        }
        this.parsers = parsers;
    }

    parse(markdown: string): string {
        for (const parser of this.parsers) {
            markdown = parser.apply(markdown);
        }
        return markdown;
    }

    addParser(parser: IMarkdownParser) {
        this.parsers.push(parser);
    }

    setParsers(parsers: IMarkdownParser[]) {
        this.parsers = parsers;
    }

    getParsers() {
        return this.parsers;
    }
}

export const markDownParserInstance = new MarkDownParser([
    new BoldParser(),
    new ItalicizedParser(),
    new StrikeParser(),
    new InlineParser(),
    new CodeParser(),
    new LinkParser(),
    new ImageParser(),
    new HeadingParser(),
    new QuoteParser(),
    new ListParser(),
    new HrParser()
]);