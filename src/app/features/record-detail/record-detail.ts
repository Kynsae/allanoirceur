import { Component, effect, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { map } from "rxjs";
import { RECORDS } from "../../core/datas/records.data";
import { ArtistRecord } from "../../core/models/artist-record.model";
import { LinkPreview } from "../../shared/components/link-preview/link-preview";

@Component({
  selector: "app-record-detail",
  imports: [LinkPreview],
  templateUrl: "./record-detail.html",
  styleUrl: "./record-detail.scss",
})
export class RecordDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public readonly activeRecord = signal<ArtistRecord | undefined>(undefined);

  private readonly id = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get("id"))
    )
  );

  constructor() {
    effect(() => {
      const recordId = this.id();

      const record = RECORDS.find(r => r.id === recordId);

      if (!record) {
        this.router.navigateByUrl("/");
        return;
      }

      this.activeRecord.set(record);
    });
  }
}