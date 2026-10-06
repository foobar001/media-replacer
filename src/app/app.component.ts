import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReplacerComponent } from './replacer/replacer.component';
import { HighlightDirective } from './highlight.directive';
import { ReplacerMeta } from './app.models';
import Mustache from 'mustache';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [CommonModule, ReplacerComponent, HighlightDirective],
})
export class AppComponent {
  replacers: { [id: string]: ReplacerMeta | null } = { '0': null };

  private latestId = 0;

  replacerCode = '';
  isReplacerCodeModalVisible = false;
  toast: string | null = null;

  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  get hasValidReplacers(): boolean {
    return Object.values(this.replacers).some((meta) => meta !== null);
  }

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
    if (!this.hasValidReplacers) {
      return;
    }

    fetch('./replacer-template.mustache')
      .then((res) => res.text())
      .then((template) => {
        const valid = Object.values(this.replacers).filter(
          (meta): meta is ReplacerMeta => meta !== null
        );

        const payload = {
          replacers: valid.filter((item) => item.form.action === 'replace'),
          hiders: valid.filter((item) => item.form.action === 'hide'),
        };

        this.replacerCode = Mustache.render(template, payload);
        this.isReplacerCodeModalVisible = true;
      });
  }

  copyCode() {
    navigator.clipboard
      .writeText(this.replacerCode)
      .then(() => this.showToast('Код скопирован в буфер обмена'))
      .catch(() => this.showToast('Не удалось скопировать код'));
  }

  hideReplacerCode() {
    this.isReplacerCodeModalVisible = false;
  }

  private showToast(message: string) {
    clearTimeout(this.toastTimer);
    this.toast = message;
    this.toastTimer = setTimeout(() => (this.toast = null), 2200);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.hideReplacerCode();
  }
}
