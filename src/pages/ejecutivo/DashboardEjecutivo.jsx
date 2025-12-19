/**
 * Dashboard Ejecutivo - Vista para Jefes de Sucursal
 * 
 * Vista orientada a la toma de decisiones empresariales, no técnicas.
 * Permite analizar el estado térmico, comparar períodos y evaluar riesgos operativos.
 */

import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Thermometer, BarChart3, PieChart, Calendar,
  Snowflake, Activity, Zap, Search, Save, FileText
} from 'lucide-react';
import { 
  Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie,
  ComposedChart, Area
} from 'recharts';
import { getAnalisisEjecutivo, guardarResumenEjecutivo } from '../../services/api';

// Colores empresariales para estados
const COLORES_ESTADO = {
  NORMAL: '#10B981',    // Verde - Todo bien
  DESHIELO: '#F59E0B',  // Amarillo - Atención
  FALLA: '#EF4444',     // Rojo - Crítico
};

export default function DashboardEjecutivo() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [filtros, setFiltros] = useState({
    fechaInicio: '', // Sin fecha por defecto
    fechaFin: '',    // Sin fecha por defecto
    camaraId: 'todas'
  });

  const cargarDatos = async () => {
    // Validar que se hayan seleccionado fechas
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      alert('Por favor seleccione las fechas de inicio y fin para realizar la búsqueda.');
      return;
    }

    // Validar que la fecha de inicio no sea mayor que la fecha de fin
    if (filtros.fechaInicio > filtros.fechaFin) {
      alert('La fecha de inicio no puede ser mayor que la fecha de fin.');
      return;
    }

    try {
      // Limpiar datos anteriores primero
      setDatos(null);
      setLoading(true);
      
      console.log('🔍 INICIANDO BÚSQUEDA');
      console.log('📅 Filtros enviados:', filtros);
      console.log('🧹 Datos anteriores limpiados');
      
      // Pequeña pausa para asegurar que el estado se limpie
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await getAnalisisEjecutivo(filtros);
      
      console.log('✅ RESPUESTA RECIBIDA DEL SERVIDOR');
      console.log('📊 KPIs completos:', response.data?.kpis);
      console.log('📈 Total eventos en respuesta:', response.data?.kpis?.totalEventos);
      console.log('🌡️ Temperatura promedio:', response.data?.kpis?.temperaturaPromedio);
      console.log('📅 Período consultado:', `${filtros.fechaInicio} a ${filtros.fechaFin}`);
      
      // Forzar actualización del estado
      setDatos(null); // Limpiar primero
      setTimeout(() => {
        setDatos(response.data); // Luego establecer nuevos datos
        console.log('🔄 DATOS ESTABLECIDOS EN ESTADO');
        console.log('📊 Datos completos:', response.data);
        console.log('🎯 KPIs disponibles:', response.data?.kpis);
      }, 50);
      
    } catch (error) {
      console.error('❌ Error al cargar análisis ejecutivo:', error);
      alert('Error al cargar los datos. Por favor intente nuevamente.');
      setDatos(null);
    } finally {
      setLoading(false);
    }
  };

  const guardarResumen = async () => {
    if (!datos) {
      alert('No hay datos para guardar. Realice primero una búsqueda.');
      return;
    }

    // Verificar autenticación antes de guardar
    const { auth } = await import('../../services/firebase');
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      alert('❌ No está autenticado. Por favor inicie sesión para guardar resúmenes.');
      return;
    }

    const titulo = prompt(
      `Ingrese un título para este resumen:`,
      `Análisis ${filtros.fechaInicio} al ${filtros.fechaFin}`
    );

    if (!titulo) return; // Usuario canceló

    const observaciones = prompt(
      'Observaciones adicionales (opcional):',
      ''
    );

    try {
      setGuardando(true);
      
      // Obtener información del usuario actual
      const userInfo = {
        email: currentUser.email,
        nombre: currentUser.displayName || currentUser.email.split('@')[0],
        uid: currentUser.uid
      };

      const resumenData = {
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        titulo: titulo,
        observaciones: observaciones || '',
        datos: datos,
        // Enviar información del usuario explícitamente
        usuarioInfo: userInfo
      };

      console.log('💾 Guardando resumen ejecutivo:', titulo);

      await guardarResumenEjecutivo(resumenData);
      
      alert('✅ Resumen guardado exitosamente');
      
    } catch (error) {
      console.error('Error al guardar resumen:', error);
      alert('❌ Error al guardar el resumen. Intente nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  const generarReportePDF = async () => {
    if (!datos) {
      alert('No hay datos para generar reporte. Realice primero una búsqueda.');
      return;
    }

    try {
      setGenerandoPDF(true);
      
      // Importar librerías dinámicamente
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const { kpis, comparacionAdaptativa, tendenciaAdaptativa, analisisEventos } = datos;

      // Funciones de análisis (mismas que HTML)
      const analizarTemperatura = (temp) => {
        if (temp <= -5) return { estado: 'Excelente', descripcion: 'Temperatura óptima para conservación.' };
        if (temp <= -2) return { estado: 'Bueno', descripcion: 'Temperatura aceptable, dentro del rango seguro.' };
        if (temp <= 4) return { estado: 'Precaución', descripcion: 'Temperatura elevada, requiere monitoreo.' };
        return { estado: 'Crítico', descripcion: 'Temperatura peligrosa, riesgo de deterioro.' };
      };

      const analizarEventos = (eventos) => {
        if (eventos <= 10) return 'Actividad normal del sistema.';
        if (eventos <= 50) return 'Actividad dentro de parámetros esperados.';
        if (eventos <= 100) return 'Mayor actividad, revisar programación.';
        return 'Actividad excesiva, requiere revisión técnica.';
      };

      const analizarFallas = (horas) => {
        if (horas === 0) return 'Sin fallas registradas en el período.';
        if (horas <= 2) return 'Fallas menores, dentro de lo esperado.';
        if (horas <= 8) return 'Tiempo considerable fuera de servicio.';
        return 'Tiempo excesivo de fallas, requiere intervención urgente.';
      };

      // Crear nuevo documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = 20;

      // Función para verificar espacio y agregar página
      const checkPageSpace = (requiredSpace) => {
        if (currentY + requiredSpace > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
      };

      // Función para agregar texto con wrap
      const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.35) + 2;
      };

      // 1. PORTADA
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORTE EJECUTIVO', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 12;
      pdf.setFontSize(18);
      pdf.text('ANÁLISIS TÉRMICO', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 20;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema de Monitoreo de Refrigeración ColdTrack', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 10;
      pdf.text(`Período Analizado: ${filtros.fechaInicio} al ${filtros.fechaFin}`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 5;
      const fechaGeneracion = new Date().toLocaleString('es-ES');
      pdf.text(`Generado: ${fechaGeneracion}`, pageWidth / 2, currentY, { align: 'center' });

      // 2. NUEVA PÁGINA - RESUMEN EJECUTIVO
      pdf.addPage();
      currentY = 20;

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMEN EJECUTIVO', 20, currentY);
      currentY += 15;

      // KPIs con análisis
      const analisisTemp = analizarTemperatura(kpis.temperaturaPromedio);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Indicadores Principales:', 20, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const kpiAnalisis = [
        `• Temperatura Promedio: ${kpis.temperaturaPromedio}°C - ${analisisTemp.estado}`,
        `  ${analisisTemp.descripcion}`,
        '',
        `• Total de Eventos: ${kpis.totalEventos}`,
        `  ${analizarEventos(kpis.totalEventos)}`,
        '',
        `• Horas de Deshielo: ${kpis.horasDeshielo}h`,
        `  Mantenimiento programado normal del sistema.`,
        '',
        `• Horas de Falla: ${kpis.horasFalla}h`,
        `  ${analizarFallas(kpis.horasFalla)}`,
        '',
        `• Operación Normal: ${kpis.porcentajeNormal}%`,
        `  ${kpis.porcentajeNormal >= 95 ? 'Excelente rendimiento operativo.' : kpis.porcentajeNormal >= 90 ? 'Buen rendimiento, dentro de estándares.' : 'Rendimiento por debajo del óptimo.'}`
      ];

      kpiAnalisis.forEach(text => {
        if (text === '') {
          currentY += 3;
        } else {
          pdf.text(text, 25, currentY);
          currentY += 5;
        }
      });

      // 3. GRÁFICOS CON EXPLICACIONES DETALLADAS
      const graficos = [
        { 
          selector: '[data-chart="comparacion"]', 
          titulo: `Comparación por Períodos (${comparacionAdaptativa?.tipo || 'Adaptativa'})`,
          explicacion: `Este gráfico compara la actividad del sistema entre diferentes ${comparacionAdaptativa?.tipo === 'diaria' ? 'días' : comparacionAdaptativa?.tipo === 'semanal' ? 'semanas' : 'meses'} del período seleccionado. Las barras azules representan eventos totales, las rojas muestran horas de falla. Períodos con barras más altas indican mayor actividad del sistema.`
        },
        { 
          selector: '[data-chart="tendencia"]', 
          titulo: `Tendencia Temporal (${tendenciaAdaptativa?.tipo || 'Adaptativa'})`,
          explicacion: 'La tendencia muestra la evolución de la actividad del sistema a lo largo del tiempo. Líneas ascendentes indican aumento en problemas, descendentes sugieren mejora. Esta información es crucial para decisiones sobre mantenimiento e inversiones.'
        },
        { 
          selector: '[data-chart="distribucion"]', 
          titulo: 'Distribución de Estados Operativos',
          explicacion: 'Este gráfico circular muestra cómo se distribuyó el tiempo operativo. Verde = operación normal, amarillo = mantenimiento programado, rojo = tiempo perdido por fallas. Un sistema eficiente debe mostrar >90% verde, 5-8% amarillo, <2% rojo.'
        },
        { 
          selector: '[data-chart="temperaturas"]', 
          titulo: 'Evolución de Temperaturas',
          explicacion: 'Muestra temperaturas promedio y máximas diarias. La línea amarilla marca el umbral crítico de 4°C. Temperaturas fuera del rango óptimo (-8°C a -2°C) pueden resultar en pérdida de productos y incumplimiento normativo.'
        }
      ];

      for (const grafico of graficos) {
        // Nueva página para cada gráfico
        pdf.addPage();
        currentY = 20;

        // Título del gráfico
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        currentY += addWrappedText(grafico.titulo, 20, currentY, pageWidth - 40, 14);
        currentY += 5;

        try {
          // Buscar y capturar el elemento del gráfico
          const elemento = document.querySelector(grafico.selector);
          if (elemento) {
            // Capturar como imagen con mejor calidad
            const canvas = await html2canvas(elemento, {
              backgroundColor: '#1F2937',
              scale: 2,
              logging: false,
              useCORS: true,
              allowTaint: true
            });

            // Calcular dimensiones manteniendo proporción
            const maxWidth = pageWidth - 40;
            const maxHeight = 100; // Altura máxima para el gráfico
            const imgRatio = canvas.width / canvas.height;
            
            let imgWidth = maxWidth;
            let imgHeight = imgWidth / imgRatio;
            
            if (imgHeight > maxHeight) {
              imgHeight = maxHeight;
              imgWidth = imgHeight * imgRatio;
            }

            // Centrar la imagen
            const imgX = (pageWidth - imgWidth) / 2;

            // Agregar imagen al PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', imgX, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 10;

            // Agregar explicación detallada
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Análisis e Interpretación:', 20, currentY);
            currentY += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            currentY += addWrappedText(grafico.explicacion, 20, currentY, pageWidth - 40, 10);

          } else {
            pdf.setFontSize(10);
            pdf.text(`[Gráfico no disponible: ${grafico.titulo}]`, 20, currentY);
            currentY += 10;
          }
        } catch (error) {
          console.warn(`No se pudo capturar el gráfico: ${grafico.titulo}`, error);
          pdf.setFontSize(10);
          pdf.text(`[Error al capturar gráfico: ${grafico.titulo}]`, 20, currentY);
          currentY += 10;
        }
      }

      // 4. CONCLUSIONES Y RECOMENDACIONES
      pdf.addPage();
      currentY = 20;

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONCLUSIONES Y RECOMENDACIONES', 20, currentY);
      currentY += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumen del Estado Operativo:', 20, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const conclusiones = [
        `• Eficiencia General: El sistema operó normalmente durante el ${kpis.porcentajeNormal}% del tiempo analizado.`,
        `• Control Térmico: La temperatura promedio de ${kpis.temperaturaPromedio}°C ${kpis.temperaturaPromedio <= -5 ? 'es excelente para conservación.' : kpis.temperaturaPromedio <= -2 ? 'se mantiene en rango seguro.' : 'requiere monitoreo y posible ajuste.'}`,
        `• Actividad del Sistema: Se registraron ${kpis.totalEventos} eventos, incluyendo ${kpis.horasDeshielo}h de mantenimiento y ${kpis.horasFalla}h de fallas.`
      ];

      conclusiones.forEach(conclusion => {
        currentY += addWrappedText(conclusion, 25, currentY, pageWidth - 50, 10);
        currentY += 3;
      });

      currentY += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recomendaciones Estratégicas:', 20, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const recomendaciones = [
        '• Monitoreo Continuo: Mantener vigilancia constante de parámetros críticos.',
        '• Capacitación: Asegurar que el personal comprenda los indicadores de alerta.',
        '• Planificación: Programar mantenimiento preventivo basado en estos patrones.',
        kpis.horasFalla > 5 ? '• Prioridad Alta: Implementar plan de mantenimiento correctivo urgente.' : '',
        kpis.temperaturaPromedio > -2 ? '• Revisión Técnica: Evaluar calibración del sistema de refrigeración.' : '',
        kpis.porcentajeNormal < 90 ? '• Optimización: Analizar causas de baja eficiencia operativa.' : ''
      ].filter(rec => rec !== '');

      recomendaciones.forEach(recomendacion => {
        currentY += addWrappedText(recomendacion, 25, currentY, pageWidth - 50, 10);
        currentY += 3;
      });

      // 5. PIE DE PÁGINA EN TODAS LAS PÁGINAS
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10);
        pdf.text('Sistema ColdTrack - Reporte Confidencial', 20, pageHeight - 10);
      }

      // 6. GUARDAR PDF
      const nombreArchivo = `Reporte_Ejecutivo_${filtros.fechaInicio}_${filtros.fechaFin}.pdf`;
      pdf.save(nombreArchivo);

      alert('✅ Reporte PDF generado exitosamente con análisis completo');

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('❌ Error al generar el reporte PDF. Intente nuevamente.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const getExplicacionGrafico = (titulo) => {
    const explicaciones = {
      'Comparación por Períodos': 'Este gráfico muestra la cantidad de eventos (deshielos y fallas) en cada período del rango seleccionado, permitiendo identificar días o semanas con mayor actividad.',
      'Tendencia Temporal': 'Muestra la evolución de eventos y horas críticas a lo largo del tiempo. Líneas ascendentes indican aumento de problemas, descendentes indican mejora.',
      'Distribución de Estados': 'Representa el porcentaje de tiempo que las cámaras funcionaron normalmente (verde), en mantenimiento programado (amarillo) o con fallas (rojo).',
      'Evolución de Temperaturas': 'Muestra las temperaturas diarias promedio y máximas. La línea amarilla marca el umbral crítico de 4°C que no debe superarse.'
    };
    return explicaciones[titulo] || 'Análisis de datos del sistema de refrigeración.';
  };



  const generarReporteHTMLConGraficos = async () => {
    if (!datos) {
      alert('No hay datos para generar reporte. Realice primero una búsqueda.');
      return;
    }

    const fechaGeneracion = new Date().toLocaleString('es-ES');
    const { kpis, comparacionAdaptativa, tendenciaAdaptativa, analisisEventos, temperaturas } = datos;

    // Preparar datos para gráficos
    const datosComparacion = comparacionAdaptativa?.datos || [];
    const datosTendencia = tendenciaAdaptativa?.datos || [];
    const datosDistribucion = analisisEventos?.distribucion || [];
    const datosTemperaturas = temperaturas || [];

    const htmlConGraficos = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Ejecutivo con Gráficos - Análisis Térmico</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #1e40af; }
        .subtitle { font-size: 14px; color: #666; margin: 5px 0; }
        .section { margin-bottom: 40px; page-break-inside: avoid; }
        .section-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; border-left: 5px solid #2563eb; padding-left: 15px; color: #1e40af; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .kpi-card { border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); text-align: center; }
        .kpi-title { font-weight: bold; color: #374151; margin-bottom: 8px; font-size: 14px; }
        .kpi-value { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
        .kpi-analysis { font-size: 12px; color: #6b7280; font-style: italic; }
        .chart-container { width: 100%; height: 400px; margin: 20px 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
        .chart-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1e40af; text-align: center; }
        .interpretation { background: #ecfdf5; border-left: 5px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .interpretation-title { font-weight: bold; margin-bottom: 10px; color: #065f46; }
        .interpretation-text { color: #047857; line-height: 1.7; }
        .conclusions { background: #fef3c7; border: 2px solid #f59e0b; padding: 25px; border-radius: 12px; }
        .footer { margin-top: 60px; padding-top: 30px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; }
        @media print { body { margin: 0; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">REPORTE EJECUTIVO CON GRÁFICOS</div>
        <div class="subtitle">Sistema de Monitoreo de Refrigeración ColdTrack</div>
        <div class="subtitle"><strong>Período Analizado:</strong> ${filtros.fechaInicio} al ${filtros.fechaFin}</div>
        <div class="subtitle">Generado el ${fechaGeneracion}</div>
    </div>

    <div class="section">
        <div class="section-title">📊 RESUMEN EJECUTIVO</div>
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-title">🌡️ Temperatura Promedio</div>
                <div class="kpi-value">${kpis.temperaturaPromedio}°C</div>
                <div class="kpi-analysis">${kpis.temperaturaPromedio <= -5 ? 'Excelente' : kpis.temperaturaPromedio <= -2 ? 'Bueno' : 'Requiere atención'}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">⚡ Total de Eventos</div>
                <div class="kpi-value">${kpis.totalEventos}</div>
                <div class="kpi-analysis">${kpis.totalEventos <= 10 ? 'Bajo' : kpis.totalEventos <= 50 ? 'Normal' : 'Alto'}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">❄️ Horas de Deshielo</div>
                <div class="kpi-value">${kpis.horasDeshielo}h</div>
                <div class="kpi-analysis">Mantenimiento Normal</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">⚠️ Horas de Falla</div>
                <div class="kpi-value">${kpis.horasFalla}h</div>
                <div class="kpi-analysis">${kpis.horasFalla === 0 ? 'Excelente' : kpis.horasFalla <= 2 ? 'Aceptable' : 'Crítico'}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">✅ Operación Normal</div>
                <div class="kpi-value">${kpis.porcentajeNormal}%</div>
                <div class="kpi-analysis">${kpis.porcentajeNormal >= 95 ? 'Excelente' : kpis.porcentajeNormal >= 90 ? 'Bueno' : 'Deficiente'}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">📈 GRÁFICOS INTERACTIVOS</div>
        
        <!-- Gráfico de Comparación -->
        <div class="chart-container">
            <div class="chart-title">Comparación por Períodos (${comparacionAdaptativa?.tipo || 'Adaptativa'})</div>
            <canvas id="chartComparacion"></canvas>
        </div>
        <div class="interpretation">
            <div class="interpretation-title">🔍 Análisis del Gráfico:</div>
            <div class="interpretation-text">
                Este gráfico compara la actividad del sistema entre diferentes períodos. Las barras azules muestran el total de eventos, 
                mientras que las barras rojas indican horas de falla. Permite identificar patrones y períodos problemáticos.
            </div>
        </div>

        <!-- Gráfico de Tendencia -->
        <div class="chart-container">
            <div class="chart-title">Tendencia Temporal (${tendenciaAdaptativa?.tipo || 'Adaptativa'})</div>
            <canvas id="chartTendencia"></canvas>
        </div>
        <div class="interpretation">
            <div class="interpretation-title">🔍 Análisis de Tendencia:</div>
            <div class="interpretation-text">
                La tendencia muestra la evolución de eventos y horas críticas. Líneas ascendentes indican problemas crecientes, 
                descendentes sugieren mejora. Crucial para decisiones de mantenimiento e inversión.
            </div>
        </div>

        <!-- Gráfico de Distribución -->
        <div class="chart-container">
            <div class="chart-title">Distribución de Estados Operativos</div>
            <canvas id="chartDistribucion"></canvas>
        </div>
        <div class="interpretation">
            <div class="interpretation-title">🔍 Análisis de Distribución:</div>
            <div class="interpretation-text">
                Muestra cómo se distribuyó el tiempo operativo. Verde = normal, amarillo = mantenimiento, rojo = fallas. 
                Objetivo: >90% verde, 5-8% amarillo, <2% rojo.
            </div>
        </div>

        <!-- Gráfico de Temperaturas -->
        <div class="chart-container">
            <div class="chart-title">Evolución de Temperaturas</div>
            <canvas id="chartTemperaturas"></canvas>
        </div>
        <div class="interpretation">
            <div class="interpretation-title">🔍 Análisis Térmico:</div>
            <div class="interpretation-text">
                Temperaturas diarias promedio y máximas. La línea roja marca el umbral crítico de 4°C. 
                Rango óptimo: -8°C a -2°C para seguridad alimentaria.
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">💡 CONCLUSIONES Y RECOMENDACIONES</div>
        <div class="conclusions">
            <h4 style="margin-top: 0; color: #92400e;">📋 Resumen Ejecutivo</h4>
            <ul>
                <li><strong>Eficiencia General:</strong> ${kpis.porcentajeNormal}% de operación normal ${kpis.porcentajeNormal >= 95 ? '(Excelente)' : kpis.porcentajeNormal >= 90 ? '(Bueno)' : '(Requiere mejora)'}</li>
                <li><strong>Control Térmico:</strong> Temperatura promedio ${kpis.temperaturaPromedio}°C ${kpis.temperaturaPromedio <= -2 ? '(Óptima)' : '(Requiere atención)'}</li>
                <li><strong>Mantenimiento:</strong> ${kpis.horasDeshielo}h de deshielos programados</li>
                <li><strong>Fallas:</strong> ${kpis.horasFalla}h fuera de servicio ${kpis.horasFalla <= 2 ? '(Aceptable)' : '(Crítico)'}</li>
            </ul>
            
            <h4 style="color: #1e40af;">🚀 Recomendaciones</h4>
            <ul>
                ${kpis.horasFalla > 5 ? '<li><strong>Urgente:</strong> Plan de mantenimiento correctivo inmediato</li>' : ''}
                ${kpis.temperaturaPromedio > -2 ? '<li><strong>Técnico:</strong> Revisar calibración del sistema</li>' : ''}
                <li><strong>Preventivo:</strong> Monitoreo continuo de parámetros críticos</li>
                <li><strong>Capacitación:</strong> Personal debe conocer indicadores de alerta</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <div style="font-weight: bold; margin-bottom: 10px;">Sistema ColdTrack - Reporte Confidencial</div>
        <div>Generado automáticamente el ${fechaGeneracion}</div>
        <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()" style="padding: 15px 30px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                🖨️ Imprimir / Guardar como PDF
            </button>
        </div>
    </div>

    <script>
        // Configuración común de Chart.js
        Chart.defaults.font.family = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        Chart.defaults.font.size = 12;

        // 1. Gráfico de Comparación
        const ctxComparacion = document.getElementById('chartComparacion').getContext('2d');
        new Chart(ctxComparacion, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(datosComparacion.map(d => d.periodo))},
                datasets: [{
                    label: 'Eventos',
                    data: ${JSON.stringify(datosComparacion.map(d => d.eventos))},
                    backgroundColor: '#3B82F6',
                    borderColor: '#2563EB',
                    borderWidth: 1
                }, {
                    label: 'Horas de Falla',
                    data: ${JSON.stringify(datosComparacion.map(d => d.horasFalla || 0))},
                    backgroundColor: '#EF4444',
                    borderColor: '#DC2626',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // 2. Gráfico de Tendencia
        const ctxTendencia = document.getElementById('chartTendencia').getContext('2d');
        new Chart(ctxTendencia, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(datosTendencia.map(d => d.periodo))},
                datasets: [{
                    label: 'Eventos',
                    data: ${JSON.stringify(datosTendencia.map(d => d.eventos))},
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Horas Críticas',
                    data: ${JSON.stringify(datosTendencia.map(d => d.horasCriticas || 0))},
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // 3. Gráfico de Distribución (Pie)
        const ctxDistribucion = document.getElementById('chartDistribucion').getContext('2d');
        new Chart(ctxDistribucion, {
            type: 'pie',
            data: {
                labels: ${JSON.stringify(datosDistribucion.map(d => d.estado))},
                datasets: [{
                    data: ${JSON.stringify(datosDistribucion.map(d => d.porcentaje))},
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                    borderColor: ['#059669', '#D97706', '#DC2626'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });

        // 4. Gráfico de Temperaturas
        const ctxTemperaturas = document.getElementById('chartTemperaturas').getContext('2d');
        new Chart(ctxTemperaturas, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(datosTemperaturas.map(d => d.fecha))},
                datasets: [{
                    label: 'Temp. Promedio',
                    data: ${JSON.stringify(datosTemperaturas.map(d => d.tempPromedio))},
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Temp. Máxima',
                    data: ${JSON.stringify(datosTemperaturas.map(d => d.tempMaxima))},
                    borderColor: '#EF4444',
                    backgroundColor: 'transparent',
                    tension: 0.4
                }, {
                    label: 'Umbral Crítico (4°C)',
                    data: ${JSON.stringify(datosTemperaturas.map(() => 4))},
                    borderColor: '#F59E0B',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { 
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Temperatura (°C)'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    // Crear y descargar archivo HTML
    const blob = new Blob([htmlConGraficos], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Completo_${filtros.fechaInicio}_${filtros.fechaFin}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ Reporte HTML con gráficos generado exitosamente!');
  };

  // Mostrar mensaje inicial si no hay datos
  if (!datos && !loading) {
    return (
      <div className="space-y-6">
        {/* Header con filtros */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Análisis Ejecutivo</h1>
              <p className="text-gray-400">Seleccione un período para analizar el estado térmico de su sucursal</p>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Desde</label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros(prev => ({...prev, fechaInicio: e.target.value}))}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  min="2025-09-01"
                  max="2025-12-31"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros(prev => ({...prev, fechaFin: e.target.value}))}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  min="2025-09-01"
                  max="2025-12-31"
                />
              </div>
              <button
                onClick={cargarDatos}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Search size={16} />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
              
              {datos && datos.kpis && (
                <>
                  <button
                    onClick={guardarResumen}
                    disabled={guardando}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    title="Guardar este análisis para consulta posterior"
                  >
                    <Save size={16} />
                    {guardando ? 'Guardando...' : 'Guardar Resumen'}
                  </button>
                  
                  <button
                    onClick={generarReportePDF}
                    disabled={generandoPDF}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    title="Generar reporte PDF con gráficos capturados"
                  >
                    <FileText size={16} />
                    {generandoPDF ? 'Generando PDF...' : 'Reporte PDF'}
                  </button>
                  

                </>
              )}
              
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500">
                  Debug: datos={datos ? 'existe' : 'null'}, kpis={datos?.kpis ? 'existe' : 'null'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mensaje inicial */}
        <div className="text-center py-12">
          <Calendar className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">Bienvenido al Análisis Ejecutivo</h3>
          <p className="text-gray-500 mb-4">Seleccione las fechas de inicio y fin, luego presione "Buscar" para ver:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-gray-800 p-4 rounded-lg">
              <Thermometer className="h-8 w-8 text-blue-400 mb-2" />
              <h4 className="font-medium text-white mb-1">Estado de Refrigeración</h4>
              <p className="text-sm text-gray-400">Temperaturas promedio y máximas del período</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <Activity className="h-8 w-8 text-green-400 mb-2" />
              <h4 className="font-medium text-white mb-1">Eventos y Operación</h4>
              <p className="text-sm text-gray-400">Deshielos programados y fallas detectadas</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-400 mb-2" />
              <h4 className="font-medium text-white mb-1">Comparaciones</h4>
              <p className="text-sm text-gray-400">Tendencias y comparación con períodos anteriores</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header con filtros durante carga */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Análisis Ejecutivo</h1>
              <p className="text-gray-400">Cargando análisis del período seleccionado...</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Analizando datos del período seleccionado...</p>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, comparacionAdaptativa, tendenciaAdaptativa, analisisEventos, temperaturas, rankingCamaras } = datos;

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Análisis Ejecutivo</h1>
            <p className="text-gray-400">Estado térmico y riesgo operativo de su sucursal</p>
            <div className="mt-2 px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-lg inline-block">
              <span className="text-blue-300 text-sm font-medium">
                📅 Período analizado: {filtros.fechaInicio} al {filtros.fechaFin}
              </span>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros(prev => ({...prev, fechaInicio: e.target.value}))}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="2025-09-01"
                max="2025-12-31"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros(prev => ({...prev, fechaFin: e.target.value}))}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="2025-09-01"
                max="2025-12-31"
              />
            </div>
            <button
              onClick={cargarDatos}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Search size={16} />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {/* 1️⃣ INDICADORES PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          titulo="Temperatura Promedio"
          descripcion="Temperatura media de refrigeración"
          valor={`${kpis.temperaturaPromedio}°C`}
          variacion={kpis.variacionTemperatura}
          icono={Thermometer}
          color={kpis.temperaturaPromedio > -2 ? 'red' : 'green'}
          interpretacion={kpis.temperaturaPromedio > -2 ? 'Temperatura alta' : 'Temperatura óptima'}
        />
        <KPICard
          titulo="Total de Eventos"
          descripcion="Deshielos y fallas registradas"
          valor={kpis.totalEventos}
          variacion={kpis.variacionEventos}
          icono={Activity}
          color={kpis.totalEventos > 100 ? 'red' : kpis.totalEventos > 50 ? 'yellow' : 'green'}
          interpretacion={kpis.totalEventos > 100 ? 'Muchos eventos' : kpis.totalEventos > 50 ? 'Eventos normales' : 'Pocos eventos'}
        />
        <KPICard
          titulo="Horas de Deshielo"
          descripcion="Tiempo en mantenimiento programado"
          valor={`${kpis.horasDeshielo}h`}
          variacion={kpis.variacionDeshielo}
          icono={Snowflake}
          color="yellow"
          interpretacion="Mantenimiento normal"
        />
        <KPICard
          titulo="Horas de Falla"
          descripcion="Tiempo fuera de servicio"
          valor={`${kpis.horasFalla}h`}
          variacion={kpis.variacionFalla}
          icono={AlertTriangle}
          color={kpis.horasFalla > 5 ? 'red' : kpis.horasFalla > 0 ? 'yellow' : 'green'}
          interpretacion={kpis.horasFalla > 5 ? 'Fallas críticas' : kpis.horasFalla > 0 ? 'Fallas menores' : 'Sin fallas'}
        />
        <KPICard
          titulo="Operación Normal"
          descripcion="Porcentaje de tiempo funcionando bien"
          valor={`${kpis.porcentajeNormal}%`}
          variacion={kpis.variacionNormal}
          icono={CheckCircle}
          color={kpis.porcentajeNormal > 95 ? 'green' : kpis.porcentajeNormal > 90 ? 'yellow' : 'red'}
          interpretacion={kpis.porcentajeNormal > 95 ? 'Excelente' : kpis.porcentajeNormal > 90 ? 'Bueno' : 'Requiere atención'}
        />
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={guardarResumen}
          disabled={guardando}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
          title="Guardar este análisis para consulta posterior"
        >
          <Save size={20} />
          {guardando ? 'Guardando...' : 'Guardar Resumen'}
        </button>
        
        <button
          onClick={generarReportePDF}
          disabled={generandoPDF}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
          title="Generar reporte PDF con gráficos capturados"
        >
          <FileText size={20} />
          {generandoPDF ? 'Generando PDF...' : 'Reporte PDF'}
        </button>
        
        <button
          onClick={generarReporteHTMLConGraficos}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
          title="Generar HTML con gráficos embebidos"
        >
          <BarChart3 size={20} />
          Reporte HTML
        </button>
      </div>

      {/* 2️⃣ COMPARACIÓN ADAPTATIVA */}
      <div className="bg-gray-800 rounded-lg p-6" data-chart="comparacion">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {comparacionAdaptativa?.titulo || 'Comparación'}
          <span className="text-sm text-gray-400 ml-2">
            ({comparacionAdaptativa?.tipo || 'adaptativa'})
          </span>
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={comparacionAdaptativa?.datos || []}
              onMouseEnter={() => {
                console.log('📊 Datos del gráfico:', comparacionAdaptativa?.datos);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="periodo" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="eventos" fill="#3B82F6" name="Eventos" />
              <Bar dataKey="horasFalla" fill="#EF4444" name="Horas en Falla" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {comparacionAdaptativa?.datos && comparacionAdaptativa.datos.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="text-sm text-gray-400">
              📊 Mostrando {comparacionAdaptativa.datos.length} períodos de comparación
            </div>
            
            {/* Explicación corta de los datos */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2 text-xs text-blue-200">
              📊 <strong>Estos datos muestran:</strong> Cuántos deshielos y fallas ocurrieron en cada {comparacionAdaptativa.tipo === 'diaria' ? 'día' : comparacionAdaptativa.tipo === 'semanal' ? 'semana' : 'mes'} del período seleccionado.
            </div>
            
            <div className="text-xs text-gray-500">
              {comparacionAdaptativa.datos.map((item, index) => (
                <span key={index} className="mr-4">
                  {item.periodo}: {item.eventos} eventos
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3️⃣ TENDENCIA ADAPTATIVA */}
        <div className="bg-gray-800 rounded-lg p-6" data-chart="tendencia">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {tendenciaAdaptativa?.titulo || 'Tendencia'}
            <span className="text-sm text-gray-400 ml-2">
              ({tendenciaAdaptativa?.tipo || 'adaptativa'})
            </span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {/* Usar gráfico híbrido que combina barras y líneas */}
              <ComposedChart data={tendenciaAdaptativa?.datos || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="periodo" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                {/* Usar barras para eventos cuando hay pocos datos */}
                {tendenciaAdaptativa?.datos && tendenciaAdaptativa.datos.length <= 3 ? (
                  <Bar dataKey="eventos" fill="#3B82F6" name="Eventos" />
                ) : (
                  <Line 
                    type="monotone" 
                    dataKey="eventos" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
                    name="Eventos"
                  />
                )}
                {/* Siempre usar línea para horas críticas */}
                <Line 
                  type="monotone" 
                  dataKey="horasCriticas" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#EF4444', strokeWidth: 2 }}
                  name="Horas Críticas"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {tendenciaAdaptativa?.datos && tendenciaAdaptativa.datos.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-400">
                📈 Mostrando {tendenciaAdaptativa.datos.length} períodos de tendencia
              </div>
              
              {/* Explicación corta de los datos */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-2 text-xs text-purple-200">
                📈 <strong>Estos datos muestran:</strong> La evolución de eventos y tiempo fuera de servicio a lo largo del período. Si sube = más problemas, si baja = mejora.
              </div>
            </div>
          )}
        </div>

        {/* 4️⃣ ANÁLISIS DE EVENTOS */}
        <div className="bg-gray-800 rounded-lg p-6" data-chart="distribucion">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Distribución de Estados
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={analisisEventos.distribucion}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="valor"
                >
                  {analisisEventos.distribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES_ESTADO[entry.estado]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {analisisEventos.distribucion.map((item) => (
              <div key={item.estado} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORES_ESTADO[item.estado] }}
                  />
                  <span className="text-gray-300">{item.estado}</span>
                </div>
                <span className="text-white font-medium">{item.porcentaje}%</span>
              </div>
            ))}
            
            {/* Explicación corta de los datos */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-2 text-xs text-green-200">
              🥧 <strong>Estos datos muestran:</strong> Cómo se distribuyó el tiempo de operación - normal (verde), mantenimiento programado (amarillo) y fallas (rojo).
            </div>
          </div>
        </div>
      </div>

      {/* 5️⃣ TEMPERATURA EN EL TIEMPO */}
      <div className="bg-gray-800 rounded-lg p-6" data-chart="temperaturas">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Evolución Térmica Diaria
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={temperaturas}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="fecha" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Area 
                type="monotone" 
                dataKey="tempPromedio" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                stroke="#3B82F6"
                name="Temperatura Promedio"
              />
              <Line 
                type="monotone" 
                dataKey="tempMaxima" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Temperatura Máxima"
              />
              <Line 
                type="monotone" 
                dataKey="umbralCritico" 
                stroke="#F59E0B" 
                strokeDasharray="5 5"
                name="Umbral Crítico (4°C)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Explicación corta de los datos */}
        <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2 text-xs text-yellow-200">
          🌡️ <strong>Estos datos muestran:</strong> Las temperaturas diarias de las cámaras. Ideal: bajo -2°C. Crítico: sobre 4°C (línea amarilla).
        </div>
      </div>

      {/* 6️⃣ RANKING DE CÁMARAS */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Cámaras que Requieren Atención
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-3">Más Eventos</h3>
            <div className="space-y-2">
              {rankingCamaras.masEventos.map((camara, index) => (
                <div key={camara.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-primary-400 font-bold">#{index + 1}</span>
                    <span className="text-white">{camara.nombre}</span>
                  </div>
                  <span className="text-red-400 font-medium">{camara.eventos} eventos</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-300 mb-3">Más Horas en Falla</h3>
            <div className="space-y-2">
              {rankingCamaras.masFallas.map((camara, index) => (
                <div key={camara.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-primary-400 font-bold">#{index + 1}</span>
                    <span className="text-white">{camara.nombre}</span>
                  </div>
                  <span className="text-red-400 font-medium">{camara.horasFalla}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Eventos Críticos Recientes */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Eventos que Requieren Seguimiento
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300">Cámara</th>
                <th className="text-left py-3 px-4 text-gray-300">Tipo de Evento</th>
                <th className="text-left py-3 px-4 text-gray-300">Duración</th>
                <th className="text-left py-3 px-4 text-gray-300">Temp. Máxima</th>
                <th className="text-left py-3 px-4 text-gray-300">Estado</th>
              </tr>
            </thead>
            <tbody>
              {analisisEventos.eventosCriticos.map((evento) => (
                <tr key={evento.id} className="border-b border-gray-700">
                  <td className="py-3 px-4 text-white">{evento.camara}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      evento.tipo === 'FALLA' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'
                    }`}>
                      {evento.tipo === 'FALLA' ? 'Falla Crítica' : 'Deshielo Prolongado'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">{evento.duracion}</td>
                  <td className="py-3 px-4 text-white">{evento.tempMaxima}°C</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      evento.estado === 'EN_CURSO' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
                    }`}>
                      {evento.estado === 'EN_CURSO' ? 'En Curso' : 'Resuelto'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente para tarjetas de KPI mejorado
function KPICard({ titulo, descripcion, valor, variacion, icono: Icon, color, interpretacion }) {
  const colorClasses = {
    green: 'text-green-400 bg-green-900/20 border-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/20',
    red: 'text-red-400 bg-red-900/20 border-red-500/20',
  };

  const interpretacionColors = {
    green: 'text-green-300 bg-green-900/30',
    yellow: 'text-yellow-300 bg-yellow-900/30',
    red: 'text-red-300 bg-red-900/30',
  };

  const variacionColor = variacion > 0 ? 'text-red-400' : 'text-green-400';
  const VariacionIcon = variacion > 0 ? TrendingUp : TrendingDown;

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border-2 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={20} className={colorClasses[color].split(' ')[0]} />
            <p className="text-white text-sm font-semibold">{titulo}</p>
          </div>
          <p className="text-gray-400 text-xs mb-2">{descripcion}</p>
          <p className="text-3xl font-bold text-white">{valor}</p>
        </div>
      </div>
      
      {/* Interpretación clara */}
      <div className={`px-3 py-2 rounded-lg text-xs font-medium mb-3 ${interpretacionColors[color]}`}>
        {interpretacion}
      </div>

      {/* Variación vs período anterior */}
      {variacion !== undefined && (
        <div className={`flex items-center gap-1 ${variacionColor}`}>
          <VariacionIcon size={14} />
          <span className="text-xs font-medium">
            {variacion > 0 ? '+' : ''}{variacion}% vs período anterior
          </span>
        </div>
      )}
    </div>
  );
}