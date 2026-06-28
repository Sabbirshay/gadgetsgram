const productPayload = {
    title: 'HY300 Portable Mini Projector | HD Home Cinema Projector',
    description: `Transform any room into your personal cinema with the **HY300 Portable Mini Projector**. Designed for movies, gaming, presentations, and entertainment, this compact projector delivers a large-screen viewing experience while remaining lightweight and easy to carry.

With support for **Full HD 1080P decoding**, **200 ANSI lumens brightness**, **Wi-Fi**, **Wireless Screen Mirroring**, **Bluetooth 5.4**, and a **built-in speaker**, the HY300 is an excellent choice for home entertainment, office presentations, and outdoor movie nights.

Its modern design and portable size make it perfect for anyone looking to enjoy a big-screen experience wherever they go.

---

## Key Features

* Supports Full HD 1080P video playback
* Bright 200 ANSI Lumens projection
* Up to 130-inch projection size
* Wi-Fi & Bluetooth 5.4 connectivity
* Wireless Screen Mirroring
* USB 2.0 input
* HDMI compatible
* Built-in speaker
* Compact & lightweight design
* Ideal for Movies, Gaming, Presentations & Education

---

## Specifications

| Specification        | Details                                                 |
| -------------------- | ------------------------------------------------------- |
| Model                | HY300                                                   |
| Product Type         | Portable Mini Projector                                 |
| Display Technology   | LED Projection                                          |
| Native Resolution    | HD                                                      |
| Supported Resolution | Up to Full HD 1080P                                     |
| Brightness           | 200 ANSI Lumens                                         |
| Projection Size      | Up to 130 Inches                                        |
| Connectivity         | Wi-Fi, Bluetooth 5.4                                    |
| Screen Mirroring     | Supported                                               |
| Speaker              | Built-in Speaker                                        |
| Input Ports          | HDMI, USB 2.0                                           |
| Projection Distance  | Approximately 1–4 meters                                |
| Light Source         | LED                                                     |
| Power Supply         | AC Adapter                                              |
| Color                | White                                                   |
| Usage                | Home Theater, Office, Classroom, Gaming, Outdoor Movies |

---

## Package Includes

* 1 × HY300 Mini Projector
* 1 × Remote Control
* 1 × Power Adapter
* 1 × User Manual

---

## Perfect For

* Home Cinema
* Netflix & YouTube (via connected device or supported screen mirroring)
* Gaming
* Business Presentations
* Online Classes
* Outdoor Movie Nights
* Family Entertainment`,
    price: 15000,
    sale_price: 12500,
    stock: 50,
    status: 'active',
    images: JSON.stringify([
      '/assets/projector_1.png',
      '/assets/projector_2.png',
      '/assets/projector_3.png',
      '/assets/projector_4.png'
    ])
  };

async function run() {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gadgetsgram.com', password: 'Admin@123456' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.access_token || loginData.accessToken;
  console.log('Token retrieved:', !!token);
  
  const res = await fetch('http://localhost:3000/api/v1/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productPayload)
  });
  
  if (res.ok) {
    console.log('Product created successfully', await res.json());
  } else {
    console.error('Failed to create product', await res.text());
  }
}

run();
