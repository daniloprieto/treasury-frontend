import { Injectable } from '@angular/core';
import { Ticket, TicketBase } from '../models/ticket.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  public versicle = `<p>
    Traed todos los diezmos
    y probadme ahora en esto,
    dice Johová...
    Si no abriré las ventanas
    de los cielos y derramaré
    bendición hasta que sobreabunde.
    <br>
    <span style="float:right">Malaquías 3:10<span>
    </p>
    `;

  public disclaimer = `<hr>
    Este comprobante es solamente
    para control interno de tesorería
    y no corresponde a pago, cuota
    social o similar.
    <hr>`;

  public disclaimerSign = `
    Quien firma como dador reconoce <br>
    que da voluntariamente y por fé <br>
    <br><br><br>
    <hr><br>
    <span style="width:100%;text-align:center">Firma dador</span>
    `;

  user!: User;

  constructor(private _auth: AuthService) {
    this._auth.user.subscribe((user: User) => this.user = user);
  }

  printTicket(tickets: TicketBase[]) {

    let ids: number[] = [];
    let info = {
      name: '',
      lastName: '',
      titheAmount: 0,
      offeringAmount: 0,
      digital: 0
    };

    tickets.map((ticket) => {
      if (ticket.type === 'tithe') info.titheAmount = ticket.amount;
      if (ticket.type === 'offering') info.offeringAmount = ticket.amount;
      ids.push(ticket.id!);
      info.name = ticket.name;
      info.lastName = ticket.lastName;
      if (ticket.digital > 0) info.digital = ticket.digital;
    })

    let diezmoMessage = info.titheAmount > 0 ? `$ ${info.titheAmount} (pesos) <br> en caracter de diezmo` : '';
    let ofrendaMessage = info.offeringAmount > 0 ? `$ ${info.offeringAmount} (pesos) <br> en caracter de ofrenda` : '';

    let controlLine = '<span style="font-size:10px">Ticket Nº:' + ids + ' ';
    let controlData = info.digital > 0 ? controlLine + 'Digital' : controlLine + 'Efectivo';

    let leafDesign = [
      '<html lang="es"><body style="font-family: monospace, monospace !important;font-size:12px">',
      controlData,
      '<div style="width:250px">',
      '<h5>Iglesia Centro de Adoración Gilgal</h5>',
      '<span>Recibimos del sr/a: <br>' + info.name + ' ' + info.lastName + '</span><br>',
      '<span>la suma de: </span><br>',
      '<span>' + diezmoMessage + '</span><br>',
      '<span>' + ofrendaMessage + '</span><br>',
      '<br><span> Tesorero ' + this.user.name + '</span><br><br>',
      '<div style="border:1px solid black; border-radius:15px;padding:5px">' + this.versicle + '</div><br>',
      '<div>'+ this.disclaimer +'</div><br>',
      '<span>'+ this.disclaimerSign +'</span>',
      '</div>',
      '</body></html>'
    ];

    let view = window.open('', 'PRINT', 'height=400,width=600')!;

    leafDesign.map((line) => view.document.write(line));

    //view.document.close();
    view.focus();
    view.print();
    view.close();
    return true;
  }

  printReport(tickets: Ticket[], date: string) {

    let totalTithesCash = 0;
    let totalOfferingsCash = 0;
    let totalCash = 0;

    let totalTithesDigital = 0;
    let totalOfferingsDigital = 0;
    let totalDigital = 0;

    let total = 0;

    return separateTicketsForType(tickets);

    function separateTicketsForType(tickets: Ticket[]){

      let tithes: Ticket[] = [];
      let offerings: Ticket[] = [];

      tickets.map((ticket: Ticket) => {
        switch (ticket.type) {
          case 'tithe':
            tithes.push(ticket);
            break;
          case 'offering':
            offerings.push(ticket);
            break;
        }
      });

      let tableTithes = tithes.length > 0 ? createTable('tithe', tithes) : [];
      let tableOfferings = offerings.length > 0 ? createTable('offering', offerings) : [];

      return showDesign(tableTithes, tableOfferings);

    }

    function createTable(type: string, tickets: Ticket[]) {

      let selected = type === 'tithe' ? 'Diezmos' : 'Ofrendas';

      let table = [
        '<table><tr style="font-family: monospace, monospace !important;font-size:12px !important">',
        '<th style="border: 0.5px solid black">Nº</th>',
        '<th style="border: 0.5px solid black">T</th>',
        '<th style="border: 0.5px solid black">Nombre</th>',
        '<th style="border: 0.5px solid black">' + selected + '</th>',
        '<th style="border: 0.5px solid black">Tesorero</th></tr>'
      ];

      tickets.map((ticket) => {
        createRow(ticket).map((line) => table.push(line))
        calculateTotals(type, ticket.digital, ticket.amount);
      });

      table.push('</table><br>');

      return table;

    }

    function createRow(ticket:Ticket): string[]{
      let digital = ticket.digital > 0 ? 'D' : 'E';
      let name = ticket.name.slice(0, 1) + '. ' + (ticket.lastName.length > 6 ? (ticket.lastName.slice(0,5) + '.' ): ticket.lastName);

      let rowDesign = [
        '<tr style="font-family: monospace, monospace !important;font-size:12px !important">',
        '<td>' + ticket.id + '</td>',
        '<td>' + digital + '</td>',
        '<td>' + name + '</td>',
        '<td style="text-align:right">$' + ticket.amount + '</td>',
        '<td>' + ticket.treasurer + '</td>',
        '</tr>'
      ];

      return rowDesign;

    }

    function showDesign(tableTithes: string[], tableOfferings: string[]) {
      let dNow = new Date(date);
      let dateLocal = dNow.getDate()  + '/' + (dNow.getMonth() + 1) + '/' + dNow.getFullYear();


      let model = [
        '<html><body style="font-family: monospace, monospace !important;font-size:12px !important">',
        '<div style="width:250px">',
        '<h5>Iglesia Centro de Adoración Gilgal</h5><br>',
        '<span>Reporte ' + dateLocal + '</span><br><br>',
      ];

      let view = window.open('', 'PRINT', 'height=400,width=600')!;

      model.map((line) => view.document.write(line));
      tableTithes.map((line) => view.document.write(line));
      tableOfferings.map((line) => view.document.write(line));


      let tableTotals = [
        '<table style="max-width:280px">',
        '<tr style="font-family: monospace, monospace !important;font-size:12px !important">',
        '<th style="border: 0.5px solid black">(Totales)</th>',
        '<th style="border: 0.5px solid black">Efectivo</th>',
        '<th style="border: 0.5px solid black">Digital</th>',
        '<th style="border: 0.5px solid black">Total</th>',
        '</tr>',
        '<tr style="font-family: monospace, monospace !important;font-size:12px !important">',
        '<td style="font-weigth:700;border: 0.5px solid black;font-family: monospace, monospace !important;font-size:12px !important">Diezmos</td>',
        '<td style="text-align:right">$' + totalTithesCash + '</td>',
        '<td style="text-align:right">$' + totalTithesDigital + '</td>',
        '<td style="text-align:right"><strong>$' + (totalTithesCash + totalTithesDigital) + '</strong></td>',
        '</tr>',
        '<tr style="font-family: monospace, monospace !important;font-size:12px !important">',
        '<td style="font-weigth:700;border: 0.5px solid black;font-family: monospace, monospace !important;font-size:12px !important">Ofrendas</td>',
        '<td style="text-align:right">$' + totalOfferingsCash + '</td>',
        '<td style="text-align:right">$' + totalOfferingsDigital + '</td>',
        '<td style="text-align:right"><strong>$' + (totalOfferingsCash + totalOfferingsDigital) + '</strong></td>',
        '</tr>',
        '<tr style="font-family: monospace, monospace !important;font-size:12px !important">',
        '<td style="font-weigth:700;border: 0.5px solid black;font-family: monospace, monospace !important;font-size:12px !important">Total</td>',
        '<td style="text-align:right">$' + totalCash + '</td>',
        '<td style="text-align:right">$' + totalDigital + '</td>',
        '<td style="text-align:right"><strong>$' + (totalCash + totalDigital) + '</strong></td>',
        '</tr>',
        '</table>',
        '<br><br><br>',
        '<span> Revisor de cuentas</span>',
        '</div>',
        '</body></html>'
      ];

      tableTotals.map((line) => view.document.write(line));

      view.focus();
      view.print();
      view.close();
      return true;

    }

    function calculateTotals(type: string, digital: number, amount: number) {

      switch (type) {
        case 'tithe':
          digital > 0
            ? totalTithesDigital += Number(amount)
            : totalTithesCash += Number(amount);
          break;
        case 'offering':
          digital > 0
          ? totalOfferingsDigital += Number(amount)
          : totalOfferingsCash += Number(amount);
          break;
      }

      totalCash = totalTithesCash + totalOfferingsCash;
      totalDigital = totalTithesDigital + totalOfferingsDigital;
      total = totalCash + totalDigital;

    }

  }
}
