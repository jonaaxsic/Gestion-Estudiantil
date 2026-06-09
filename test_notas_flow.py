from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    # 1. Login como docente (Jorge Garrido)
    print("1. Login como docente...")
    page.goto("http://localhost:4200/login")
    page.wait_for_load_state("networkidle")
    page.fill('input[formcontrolname="email"]', "jorge.garrido@colegio.cl")
    page.fill('input[formcontrolname="password"]', "123456")
    page.click('button[type="submit"]')
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    page.screenshot(path="/tmp/01_login.png", full_page=True)
    print(f"   URL after login: {page.url}")

    # 2. Navegar al dashboard docente
    print("2. Dashboard docente...")
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    page.screenshot(path="/tmp/02_dashboard.png", full_page=True)

    # 3. Buscar y hacer click en un curso
    print("3. Buscando curso...")
    # Buscar tabs de cursos
    curso_tabs = page.locator("text=7° A").all()
    if not curso_tabs:
        curso_tabs = page.locator("text=7°A").all()
    if not curso_tabs:
        # Buscar cualquier tab de curso
        curso_tabs = page.locator(".curso-tab, .tab-item, [class*='curso']").all()
    
    print(f"   Encontrados {len(curso_tabs)} tabs de curso")
    for i, tab in enumerate(curso_tabs[:3]):
        txt = tab.inner_text()
        print(f"   Tab {i}: '{txt}'")
    
    if curso_tabs:
        curso_tabs[0].click()
        time.sleep(1)
        page.screenshot(path="/tmp/03_curso.png", full_page=True)
    
    # 4. Verificar que hay inputs de notas visibles
    print("4. Buscando inputs de notas...")
    nota_inputs = page.locator('input[ inputmode="decimal"]').all()
    print(f"   Encontrados {len(nota_inputs)} inputs de notas")
    
    if len(nota_inputs) == 0:
        # Tomar screenshot para debug
        page.screenshot(path="/tmp/04_no_inputs.png", full_page=True)
        print("   No se encontraron inputs. Tomando screenshot de debug.")
        # Buscar cualquier input
        all_inputs = page.locator("input").all()
        for i, inp in enumerate(all_inputs[:10]):
            try:
                typ = inp.get_attribute("type")
                cls = inp.get_attribute("class")
                print(f"   Input {i}: type={typ}, class={cls}")
            except:
                pass
    else:
        # 5. Ingresar nota 1 y nota 2 en el primer estudiante
        print("5. Ingresando notas...")
        # Los inputs vienen en grupos de 6 por estudiante
        # Primer estudiante: inputs[0]=nota1, inputs[1]=nota2, etc.
        
        # Nota 1
        nota_inputs[0].click()
        nota_inputs[0].fill("6.5")
        time.sleep(0.5)
        
        # Nota 2
        nota_inputs[1].click()
        nota_inputs[1].fill("5.8")
        time.sleep(0.5)
        
        page.screenshot(path="/tmp/05_notas_ingresadas.png", full_page=True)
        print("   Notas 6.5 y 5.8 ingresadas")
        
        # 6. Click en "Guardar Notas"
        print("6. Guardando notas...")
        guardar_btn = page.locator("text=Guardar Notas").all()
        if guardar_btn:
            guardar_btn[0].click()
            time.sleep(2)
            page.screenshot(path="/tmp/06_despues_guardar.png", full_page=True)
            print("   Click en Guardar Notas")
        else:
            print("   No se encontró botón Guardar Notas")
            # Buscar botones
            btns = page.locator("button").all()
            for i, btn in enumerate(btns[:15]):
                try:
                    txt = btn.inner_text()
                    if txt.strip():
                        print(f"   Botón {i}: '{txt.strip()}'")
                except:
                    pass
        
        # 7. Verificar que las notas son visibles
        time.sleep(1)
        print("7. Verificando notas guardadas...")
        
        # Buscar el valor 6,5 en el HTML (formato chileno con coma)
        content = page.content()
        has_65 = "6,5" in content or "6.5" in content
        has_58 = "5,8" in content or "5.8" in content
        print(f"   Nota 6.5 visible: {has_65}")
        print(f"   Nota 5.8 visible: {has_58}")
        
        # Verificar si hay botones de editar (lápiz)
        edit_btns = page.locator(".nota-edit-btn").all()
        print(f"   Botones editar (lápiz): {len(edit_btns)}")
        
        # Verificar si hay botones de eliminar (x)
        delete_btns = page.locator(".nota-delete-btn").all()
        print(f"   Botones eliminar (x): {len(delete_btns)}")
        
        page.screenshot(path="/tmp/07_resultado.png", full_page=True)

    print("\n✅ Prueba completada. Screenshots en /tmp/")
    browser.close()
