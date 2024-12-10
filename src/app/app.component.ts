import { Component } from '@angular/core';
import { ReplacerMeta } from './app.models';
import { ReplacerComponent } from './replacer/replacer.component';
import { CommonModule } from '@angular/common';
import Mustache from 'mustache';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [CommonModule, ReplacerComponent],
})
export class AppComponent {
  replacers: { [id: string]: ReplacerMeta } = { '0': null };

  private latestId = 0;

  replacerCode = '';
  isReplacerCodeModalVisible = false;

  addReplacer() {
    const id = this.generateId();
    this.replacers[id] = null;
  }

  updateReplacer(meta: ReplacerMeta) {
    this.replacers[meta.id] = meta;
  }

  removeReplacer(id: string) {
    delete this.replacers[id];
  }

  generateId() {
    this.latestId = this.latestId + 1;
    return this.latestId;
  }

  showReplacerCode() {
    fetch('./replacer-template.mustache')
      .then((res) => res.text())
      .then((template) => {
        const replacers = Object.values(this.replacers);

        const payload = {
          replacers: replacers.filter((item) => item.form.action === 'replace'),
          hiders: replacers.filter((item) => item.form.action === 'hide'),
        };

        this.replacerCode = Mustache.render(template, payload);
        this.isReplacerCodeModalVisible = true;

        setTimeout(() => {
          const textareaNode = document.getElementById('replacerCodeTextarea') as HTMLTextAreaElement;
          textareaNode.select();
          navigator.clipboard.writeText(this.replacerCode);
        })
      });
  }

  hideReplacerCode() {
    this.isReplacerCodeModalVisible = false;
  }
}
