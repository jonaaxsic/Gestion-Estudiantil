import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Estudiante, Nota } from '../../../../shared/models';
import { DocenteDataService } from '../../services/docente-data.service';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-docente-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente-notas.component.html',
  styleUrls: ['./docente-notas.component.css']
})
export class DocenteNotasComponent {
  private readonly api = inject(ApiService);
  readonly data = inject(DocenteDataService);

  cursoId = input.required<string>();
  asignatura = input.required<string>();
  estudiantes = input<Estudiante[]>([]);
  notas = input<Nota[]>([]);
  saving = input(false);
  studentSearchQuery = input('');

  saved = output<string>();
  error = output<string>();
  refresh = output<void>();

  notasEditando = signal<Record<string, Record<string, string>>>({});
  notasEnEdicion = signal<Set<string>>(new Set());

  readonly numerosNota = ['nota1', 'nota2', 'nota3', 'nota4', 'nota5', 'nota6'];

  estudiantesOrdenados = computed(() => {
    const query = this.studentSearchQuery().toLowerCase().trim();
    let lista = [...this.estudiantes()];
    if (query) {
      lista = lista.filter(e => `${e.apellido} ${e.nombre}`.toLowerCase().includes(query));
    }
    return lista.sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre));
  });

  get hayCambiosSinGuardar(): boolean {
    return Object.keys(this.notasEditando()).length > 0;
  }

  onNotaInput(estudianteId: string, numNota: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(',', '.');
    if (valor === '') {
      this.notasEditando.update(s => ({ ...s, [estudianteId]: { ...(s[estudianteId] || {}), [numNota]: '' } }));
      return;
    }
    if (!/^[1-7](\.\d?)?$/.test(valor)) {
      input.value = (this.notasEditando()[estudianteId]?.[numNota] ?? '').replace('.', ',');
      return;
    }
    this.notasEditando.update(s => ({ ...s, [estudianteId]: { ...(s[estudianteId] || {}), [numNota]: valor } }));
  }

  getNotaValor(nota: Nota | undefined, estudianteId: string, num: string): string {
    const local = this.notasEditando()[estudianteId]?.[num];
    if (local !== undefined) return local.replace('.', ',');
    if (!nota?.notas) return '';
    const val = nota.notas[num];
    return (val == null) ? '' : String(val).replace('.', ',');
  }

  isNotaInvalida(estudianteId: string, num: string): boolean {
    const val = this.notasEditando()[estudianteId]?.[num];
    if (!val) return false;
    const n = parseFloat(val);
    return isNaN(n) || n < 1 || n > 7;
  }

  getNotaEstudiante(estudianteId: string): Nota | undefined {
    return this.notas().find(n => n.estudiante_id === estudianteId);
  }

  notaGuardada(estudianteId: string, numNota: string): boolean {
    return this.getNotaEstudiante(estudianteId)?.notas?.[numNota] != null;
  }

  isNotaEnEdicion(estudianteId: string, numNota: string): boolean {
    return this.notasEnEdicion().has(`${estudianteId}-${numNota}`);
  }

  alternarEdicionNota(estudianteId: string, numNota: string): void {
    const key = `${estudianteId}-${numNota}`;
    const actual = new Set(this.notasEnEdicion());
    actual.has(key) ? actual.delete(key) : actual.add(key);
    this.notasEnEdicion.set(actual);
  }

  calcularPromedio(notaEst: Nota | undefined, estudianteId: string): string {
    const local = this.notasEditando();
    const valores: number[] = [];
    for (const key of this.numerosNota) {
      let v: any = local[estudianteId]?.[key] ?? notaEst?.notas?.[key];
      if (v != null && v !== '') { const num = Number(v); if (!isNaN(num)) valores.push(num); }
    }
    return valores.length === 0 ? '-' : (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1);
  }

  guardarTodasLasNotas(): void {
    if (!this.cursoId() || !this.asignatura()) { this.error.emit('No hay curso/asignatura seleccionada'); return; }
    const editando = this.notasEditando();
    const ops: { estudianteId: string; numNota: string; valor: number }[] = [];
    for (const estId of Object.keys(editando)) {
      for (const num of Object.keys(editando[estId])) {
        const v = parseFloat(editando[estId][num]);
        if (!isNaN(v) && v >= 1 && v <= 7) ops.push({ estudianteId: estId, numNota: num, valor: v });
      }
    }
    if (!ops.length) { alert('No hay notas válidas por guardar'); return; }

    this.data.saving.set(true);
    let exitosas = 0, fallidas = 0, idx = 0;
    const siguiente = () => {
      if (idx >= ops.length) {
        this.data.saving.set(false);
        this.notasEditando.set({});
        this.data.renderTick.update(v => v + 1);
        this.refresh.emit();
        const msg = fallidas === 0 ? `${exitosas} nota(s) guardada(s)` : `${exitosas} guardada(s), ${fallidas} fallaron`;
        fallidas === 0 ? this.saved.emit(msg) : this.error.emit(msg);
        return;
      }
      const op = ops[idx++];
      this.api.actualizarNotaSimple({
        estudiante_id: op.estudianteId, curso_id: this.cursoId(),
        asignatura: this.asignatura(), ano_escolar: new Date().getFullYear(),
        numero_nota: op.numNota, valor: op.valor
      }).subscribe({ next: () => { exitosas++; siguiente(); }, error: () => { fallidas++; siguiente(); } });
    };
    siguiente();
  }

  guardarNotaIndividual(estudianteId: string, numNota: string): void {
    const valorStr = this.notasEditando()[estudianteId]?.[numNota];
    if (!valorStr) return;
    const valor = parseFloat(valorStr);
    if (isNaN(valor) || valor < 1 || valor > 7) return;

    this.data.saving.set(true);
    this.api.actualizarNotaSimple({
      estudiante_id: estudianteId, curso_id: this.cursoId(),
      asignatura: this.asignatura(), ano_escolar: new Date().getFullYear(),
      numero_nota: numNota, valor
    }).subscribe({
      next: () => {
        const key = `${estudianteId}-${numNota}`;
        const actual = new Set(this.notasEnEdicion()); actual.delete(key); this.notasEnEdicion.set(actual);
        this.notasEditando.update(s => {
          const n = { ...s }; if (n[estudianteId]) { const e = { ...n[estudianteId] }; delete e[numNota]; n[estudianteId] = e; } return n;
        });
        this.data.renderTick.update(v => v + 1);
        this.data.saving.set(false);
        this.saved.emit('Nota guardada');
      },
      error: (err) => { this.data.saving.set(false); this.error.emit(err.error?.error || 'Error al guardar'); }
    });
  }

  eliminarNota(estudianteId: string, numNota: string): void {
    if (!confirm('¿Eliminar esta nota?')) return;
    this.data.saving.set(true);
    this.api.eliminarCampoNota({
      estudiante_id: estudianteId, curso_id: this.cursoId(),
      asignatura: this.asignatura(), ano_escolar: new Date().getFullYear(),
      numero_nota: numNota
    }).subscribe({
      next: () => { this.data.saving.set(false); this.data.renderTick.update(v => v + 1); this.refresh.emit(); this.saved.emit('Nota eliminada'); },
      error: () => { this.data.saving.set(false); this.error.emit('Error al eliminar'); }
    });
  }
}
