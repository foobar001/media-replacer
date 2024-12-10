import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  EMPTY,
  map,
  Observable,
  of,
  retry,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import {
  ReplacerMeta,
  ImageFullMeta,
  ImageSize,
  ReplacerForm,
  MediaUrlStatus,
} from '../app.models';
import {
  MEDIA_BASE_URL,
  MEDIA_BOARD_REGEX,
  MEDIA_THREAD_REGEX,
  MEDIA_TIMESTAMP_REGEX,
} from '../app.consts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-replacer',
  templateUrl: './replacer.component.html',
  styleUrl: './replacer.component.scss',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplacerComponent implements OnInit, OnDestroy {
  @Input() id: string;

  @Output() onUpdateMeta = new EventEmitter<ReplacerMeta>();
  @Output() onRemoveReplacer = new EventEmitter<string>();

  form = this.fb.group({
    from: '',
    to: '',
    action: 'replace',
  } as ReplacerForm);

  fromStatus$ = new BehaviorSubject<MediaUrlStatus>('unknown');

  toStatus$ = new BehaviorSubject<MediaUrlStatus>('unknown');

  private onDestroy$ = new Subject<void>();

  private refreshFrom$ = new Subject<void>();

  metaFrom$ = combineLatest([
    this.form.controls.from.valueChanges,
    this.refreshFrom$.pipe(startWith('')),
  ]).pipe(
    tap(() => this.fromStatus$.next('unknown')),
    switchMap(([from]) =>
      this.getImageFullMeta(from).pipe(
        catchError((err) => {
          this.fromStatus$.next('invalid');
          return EMPTY;
        })
      )
    ),
    tap(() => this.fromStatus$.next('valid')),
    takeUntil(this.onDestroy$),
    shareReplay(1)
  );

  private action$ = this.form.controls.action.valueChanges.pipe(
    startWith(this.form.controls.action.value)
  );

  private refreshTo$ = new Subject<void>();

  metaTo$ = combineLatest([
    this.form.controls.to.valueChanges,
    this.action$,
    this.refreshTo$.pipe(startWith(''))
  ]).pipe(
    tap(() => this.toStatus$.next('unknown')),
    switchMap(([to, action]) => {
      if (action === 'hide') {
        return of(null);
      }

      return this.getImageFullMeta(to).pipe(
        catchError((err) => {
          this.toStatus$.next('invalid');
          return EMPTY;
        })
      );
    }),
    tap(() => this.toStatus$.next('valid')),
    takeUntil(this.onDestroy$),
    shareReplay(1)
  );

  private fullMeta$ = combineLatest([
    this.form.valueChanges.pipe(map((form) => form as ReplacerForm)),
    this.metaFrom$,
    this.metaTo$,
  ]).pipe(
    map(([form, metaFrom, metaTo]) => ({ id: this.id, form, metaFrom, metaTo }))
  );

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.listenFullMetaInfoChange();
    this.listenActionChange();
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  removeReplacer() {
    this.onRemoveReplacer.emit(this.id);
  }

  retryRefreshFrom() {
    this.refreshFrom$.next();
  }

  retryRefreshTo() {
    this.refreshTo$.next();
  }

  private listenFullMetaInfoChange() {
    this.fullMeta$
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((meta) => this.onUpdateMeta.emit(meta));
  }

  private listenActionChange() {
    this.form.controls.action.valueChanges
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((action) =>
        action === 'replace'
          ? this.form.controls.to.enable()
          : this.form.controls.to.disable()
      );
  }

  private getImageFullMeta(originUrl: string): Observable<ImageFullMeta> {
    const RETRY_AMOUNT = 5;
    const RETRY_DELAY = 300;

    const originImgMeta$ = this.getImageSize(originUrl).pipe(
      retry({ count: RETRY_AMOUNT, delay: RETRY_DELAY })
    );

    const thumbImageUrl = this.getThumbImageUrl(originUrl);

    if (!thumbImageUrl) {
      throwError(() => new Error('Cannot calc thumb image url'));
    }

    const thumbImgMeta$ = this.getImageSize(thumbImageUrl).pipe(
      retry({ count: RETRY_AMOUNT, delay: RETRY_DELAY })
    );

    return combineLatest([originImgMeta$, thumbImgMeta$]).pipe(
      map(([origin, thumb]) => ({ origin, thumb }))
    );
  }

  private getThumbImageUrl(originImageUrl: string) {
    const baseUrl = originImageUrl.match(MEDIA_BASE_URL);

    if (!baseUrl) {
      console.error(`Cannot calc baseUrl for '${originImageUrl}'`);
      return null;
    }

    const board = originImageUrl.match(MEDIA_BOARD_REGEX);

    if (!board) {
      console.error(`Cannot calc board for '${originImageUrl}'`);
      return null;
    }

    const thread = originImageUrl.match(MEDIA_THREAD_REGEX);

    if (!thread) {
      console.error(`Cannot calc thread for '${originImageUrl}'`);
      return null;
    }

    const timestamp = originImageUrl.match(MEDIA_TIMESTAMP_REGEX);

    if (!timestamp) {
      console.error(`Cannot calc timestamp for '${originImageUrl}'`);
      return null;
    }

    const thumbUrl = `${baseUrl[0]}/${board[0]}/thumb/${thread[0]}/${timestamp[0]}s.jpg`;

    return thumbUrl;
  }

  private getRelativeUrl(fullUrl: string) {
    return new URL(fullUrl).pathname;
  }

  private getImageSize(fullUrl: string) {
    return new Observable<ImageSize>((observer) => {
      const img = new Image();
      const relativeUrl = this.getRelativeUrl(fullUrl);
      img.onload = function () {
        observer.next({
          fullUrl: fullUrl,
          relativeUrl: relativeUrl,
          width: img.width,
          height: img.height,
        });
        observer.complete();
      };
      img.onerror = function (e) {
        observer.error(e);
        observer.complete();
      };
      img.src = fullUrl;
    });
  }
}
