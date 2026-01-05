import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateVentaPDF = async (venta: any) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura de Venta</title>
        <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #27ae60; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #27ae60; }
            .info-section { margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .label { font-weight: bold; color: #7f8c8d; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #f8f9fa; color: #2c3e50; }
            .totals { margin-top: 30px; text-align: right; }
            .total-row { font-size: 18px; margin-bottom: 5px; }
            .grand-total { font-size: 22px; font-weight: bold; color: #27ae60; border-top: 2px solid #27ae60; padding-top: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #95a5a6; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">FACTURA DE VENTA</div>
            <div>Gestión Avícola</div>
        </div>

        <div class="info-section">
            <div class="info-row">
                <span><span class="label">Fecha:</span> ${new Date(venta.fecha).toLocaleDateString()}</span>
                <span><span class="label">Nro:</span> ${venta.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="info-row">
                <span><span class="label">Cliente:</span> ${venta.cliente}</span>
            </div>
            <div class="info-row">
                <span><span class="label">Lote:</span> ${venta.lote_nombre || 'N/A'}</span>
            </div>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Venta de Aves</td>
                    <td>${venta.cantidad}</td>
                    <td>$${venta.precio_unitario.toLocaleString()}</td>
                    <td>$${venta.total.toLocaleString()}</td>
                </tr>
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span class="label">Total:</span> $${venta.total.toLocaleString()}
            </div>
            <div class="total-row">
                <span class="label">Abono:</span> $${(venta.abono || 0).toLocaleString()}
            </div>
            <div class="grand-total">
                <span class="label">Saldo Pendiente:</span> $${(venta.total - (venta.abono || 0)).toLocaleString()}
            </div>
        </div>

        <div class="info-section" style="margin-top: 30px;">
            <div class="label">Forma de Pago:</div>
            <div>${venta.forma_pago.replace('_', ' ')}</div>
            ${venta.observaciones ? `<div class="label" style="margin-top: 10px;">Observaciones:</div><div>${venta.observaciones}</div>` : ''}
        </div>

        <div class="footer">
            Gracias por su compra. Documento generado automáticamente por el Sistema de Gestión Avícola.
        </div>
    </body>
    </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

export const generateResumenGlobalPDF = async (summary: any) => {
    const formatCurrency = (amount: number) => `$${(amount || 0).toLocaleString()}`;
    
    const lotesRows = summary.detalles_lotes.map((lote: any) => `
        <tr>
            <td>${lote.nombre}</td>
            <td>${lote.finca}</td>
            <td>${lote.mortalidad_total}</td>
            <td>${formatCurrency(lote.ventas_totales)}</td>
            <td>${formatCurrency(lote.abonos_recibidos)}</td>
            <td style="color: #e67e22; font-weight: bold;">${formatCurrency(lote.cuentas_por_cobrar)}</td>
        </tr>
    `).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #2c3e50; }
            .header { text-align: center; border-bottom: 3px solid #27ae60; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 28px; font-weight: bold; color: #27ae60; text-transform: uppercase; }
            .date { font-size: 14px; color: #7f8c8d; margin-top: 5px; }
            
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #27ae60; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
            
            .summary-grid { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }
            .summary-card { flex: 1; min-width: 200px; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60; }
            .card-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; margin-bottom: 5px; }
            .card-value { font-size: 20px; font-weight: bold; color: #2c3e50; }

            .table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            .table th, .table td { border: 1px solid #eee; padding: 10px; text-align: left; }
            .table th { background-color: #27ae60; color: white; }
            .table tr:nth-child(even) { background-color: #fcfcfc; }
            
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #95a5a6; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">Reporte de Resumen Global</div>
            <div class="date">Generado el: ${new Date().toLocaleString()}</div>
        </div>

        <div class="section">
            <div class="section-title">Estado Financiero General</div>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-label">Dinero en Caja</div>
                    <div class="card-value">${formatCurrency(summary.flujo_caja.caja_actual)}</div>
                </div>
                <div class="summary-card" style="border-left-color: #f39c12;">
                    <div class="card-label">Cuentas por Cobrar</div>
                    <div class="card-value">${formatCurrency(summary.flujo_caja.cuentas_por_cobrar)}</div>
                </div>
                <div class="summary-card" style="border-left-color: #3498db;">
                    <div class="card-label">Patrimonio Total</div>
                    <div class="card-value">${formatCurrency(summary.balance.activo_total)}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Desglose Detallado por Lote</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Lote</th>
                        <th>Finca</th>
                        <th>Muertes</th>
                        <th>Ventas Totales</th>
                        <th>Abonos</th>
                        <th>Pendiente Cobro</th>
                    </tr>
                </thead>
                <tbody>
                    ${lotesRows}
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Resumen de Operación</div>
            <div class="summary-grid">
                <div class="summary-card" style="border-left-color: #9b59b6;">
                    <div class="card-label">Utilidad Operativa</div>
                    <div class="card-value">${formatCurrency(summary.resultado.utilidad_operativa)}</div>
                </div>
                <div class="summary-card" style="border-left-color: #2ecc71;">
                    <div class="card-label">Margen Operativo</div>
                    <div class="card-value">${summary.resultado.margen_operativo.toFixed(2)}%</div>
                </div>
                <div class="summary-card" style="border-left-color: #e74c3c;">
                    <div class="card-label">Gastos Operativos</div>
                    <div class="card-value">${formatCurrency(summary.flujo_caja.gastos_operativos)}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            Este reporte es un resumen consolidado de la operación avícola.<br>
            Documento generado automáticamente por el Sistema de Gestión Avícola.
        </div>
    </body>
    </html>
    `;

    try {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
        console.error('Error generating Global Summary PDF:', error);
        throw error;
    }
};
