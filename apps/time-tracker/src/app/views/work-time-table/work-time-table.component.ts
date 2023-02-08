import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewChild,
} from '@angular/core';
import { MatTable, MatTableModule } from '@angular/material/table';
import { filter, Observable, startWith, Subject, take, tap } from 'rxjs';
import { WorkTime } from '../../core/entities/work-time.entity';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { WorkTimeFormComponent } from '../work-time-form/work-time-form.component';
import { WorkTimeDataSource, WorkTimeViewModel } from './work-time-datasource';
import {
  AsyncPipe,
  DatePipe,
  NgClass,
  NgIf,
  TitleCasePipe,
} from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TimePipe } from '../../core/pipes/time/time.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MAT_PAGINATOR_DEFAULT_OPTIONS,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { map } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'tt-work-time-table',
  templateUrl: './work-time-table.component.html',
  styleUrls: ['./work-time-table.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    NgClass,
    NgIf,
    TimePipe,
    TitleCasePipe,
  ],
  providers: [
    {
      provide: MAT_PAGINATOR_DEFAULT_OPTIONS,
      useValue: { formFieldAppearance: 'standard' },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkTimeTableComponent implements AfterViewInit {
  @ViewChild(MatTable)
  readonly table!: MatTable<WorkTimeViewModel>;

  private readonly breakpointObserver = inject(BreakpointObserver);

  private dialogConfig?: MatDialogConfig;

  readonly displayedColumns = [
    'date',
    'start',
    'end',
    'pause',
    'total',
    'type',
    'notes',
    'actions',
  ] as const;

  readonly pageSizeOptions = [5, 10, 30, 60, 100] as const;

  private readonly pageSizeKey = 'pageSize';

  private readonly defaultPageSize = localStorage.getItem(this.pageSizeKey)
    ? Number(localStorage.getItem(this.pageSizeKey))
    : this.pageSizeOptions[0];

  readonly dataSource = new WorkTimeDataSource({
    pageSize: this.defaultPageSize,
    pageIndex: 0,
    length: 0,
  });

  readonly length$ = this.dataSource.count$();

  private readonly pageEventSubject = new Subject<PageEvent>();

  readonly pageSize$: Observable<number> = this.pageEventSubject
    .asObservable()
    .pipe(
      map(({ pageSize }) => pageSize),
      tap((pageSize) => this.savePageSize(pageSize)),
      startWith(this.defaultPageSize)
    );
  private readonly dialog = inject(MatDialog);

  ngAfterViewInit(): void {
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(
        map((breakpoint) => breakpoint.matches),
        map((isHandset) =>
          isHandset
            ? {
                width: '95vw',
                maxWidth: '95vw',
                panelClass: 'mat-dialog-mobile',
              }
            : {}
        )
      )
      .subscribe((config) => {
        this.dialogConfig = config;
      });
  }

  addRow() {
    this.openDialog().subscribe((workTime) =>
      this.dataSource.addData(<WorkTime>workTime)
    );
  }

  editRow(workTime: WorkTime) {
    this.openDialog(workTime).subscribe((workTime) =>
      this.dataSource.updateData(<WorkTime>workTime)
    );
  }

  deleteRow(workTime: WorkTime) {
    this.dataSource.removeData(workTime.id);
  }

  changePage(pageEvent: PageEvent) {
    this.pageEventSubject.next(pageEvent);
    this.dataSource.changePage(pageEvent);
  }

  private openDialog(workTime?: WorkTime) {
    const dialogRef = this.dialog.open<
      WorkTimeFormComponent,
      WorkTime,
      WorkTime
    >(WorkTimeFormComponent, {
      data: workTime,
      ...this.dialogConfig,
    });
    return dialogRef.afterClosed().pipe(
      filter((value) => value != null),
      take(1)
    );
  }

  private savePageSize(pageSize: number) {
    localStorage.setItem(this.pageSizeKey, pageSize.toString());
  }
}
