import { Directive, ElementRef, Input, OnChanges } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('css', css);

@Directive({
  selector: '[appHighlight]',
})
export class HighlightDirective implements OnChanges {
  @Input() appHighlight = '';
  @Input() language = 'html';

  constructor(private el: ElementRef) {}

  ngOnChanges() {
    this.highlight();
  }

  private highlight() {
    if (!this.appHighlight) {
      return;
    }

    const highlightedCode = hljs.highlight(this.appHighlight, { language: this.language }).value;
    this.el.nativeElement.innerHTML = `<pre><code class="hljs language-${this.language}">${highlightedCode}</code></pre>`;
  }
}
