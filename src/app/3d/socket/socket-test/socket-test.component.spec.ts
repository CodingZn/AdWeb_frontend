import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocketTestComponent } from './socket-test.component';

describe('SocketTestComponent', () => {
  let component: SocketTestComponent;
  let fixture: ComponentFixture<SocketTestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SocketTestComponent]
    });
    fixture = TestBed.createComponent(SocketTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
