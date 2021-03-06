import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Subscription, distinct, tap } from 'rxjs';
import { TicketBase } from 'src/app/core/models/ticket.model';
import { User } from 'src/app/core/models/user.model';
import { AlertService } from 'src/app/core/services/alert.service';
import { TYPE } from 'src/app/core/services/helpers.service';
import { PrintService } from 'src/app/core/services/print.service';
import { TicketService } from 'src/app/core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-egress',
  templateUrl: './egress.component.html',
  styleUrls: ['./egress.component.scss']
})
export class EgressComponent implements OnInit {

  private _sub$: Subscription[] = [];
  public user!: User;
  public financialForm = this._fb.group({
    description:['', [Validators.required, Validators.minLength(5)]],
    amount: ['', Validators.required],
    digital:[false]
  });


  constructor(
    private _auth: AuthService,
    private _ticket: TicketService,
    private _alert: AlertService,
    private _print: PrintService,
    private _fb: FormBuilder
    ) { }

  ngOnInit(): void {
    this._sub$.push(
      this._auth.user.subscribe((user: User) => this.user = user)
    );
  }

  setTicket(event: any) {
    event.preventDefault();

    const form = this.financialForm

    if (form.valid) {

      if (form.get('amount')?.value > 0) {

        let ticket: TicketBase = {
          amount: form.get('amount')?.value,
          type: TYPE.EGRESS,
          description: form.get('description')?.value,
          digital: form.get('isDigital')?.value ? 1 : 0,
          treasurer: this.user.id,
          name: '',
          lastName: '',
        };

        this.saveTicket(ticket);

      } else {
          this._alert.showAlert('Debe ingresar al menos un valor');
      }
    } else {
      this._alert.showAlert('Debe ingresar una descripción');
    }

  }

  saveTicket(ticket: TicketBase) {
    this._sub$.push(
      this._ticket.generateTicket(ticket)
        .pipe(
          distinct(),
          tap({
            next: ({ id }) => {
              ticket.id = id;
              if (this._print.print('designTicketEgress', ticket)) this.reset();
            },
            error: (error) => {
              this._alert.showAlert('Error al guardar el Ticket');
              console.error(error);
            }
          }

          )
        )
        .subscribe()
    );

  }

  reset() {
    this.financialForm.reset();
  }

  ngOnDestroy(): void {
    this.reset();
    this._sub$.map((sub) => sub.unsubscribe());
  }

}
