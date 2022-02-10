# Himilo Online Doctor Booking

In this, I'm going to show you some important `endpoints`

If you want to see how to send requests from a different _programming languages_ see below link:

[Himilo Online Doctor Booking API Documentation](https://documenter.getpostman.com/view/16597502/UVRGFjfF)

# **GET** Towns

Get all towns

```js
https://himiloapi.com/api/v1/towns
```

# **GET** Doctors

Get current active doctors

```js
https://himiloapi.com/api/v1/doctors
```

# **GET** Search Patient

Get a patient or patients by using `PatientID` or `Tel`

```js
https://himiloapi.com/api/v1/patients?search=p0001
```

### **Params**

`search: p0001`

# **POST** Assign Existed Patient To A Doctor

Assign existed patient to a doctor

```js
https://himiloapi.com/api/v1/patients/existing
```

### **Body**

```js
{
    "PatientID": "P0001",
    "DoctorID": "D0001",
    "PatientType": "Single",
    "Booked": 1,
    "AppointmentDate": "2022-01-13",
    "BookingTel": "615301507"
}
```

# **POST** Create New Patient And Assign To A Doctor

Create new patient and assign to a doctor

```js
https://himiloapi.com/api/v1/patients/new
```

### **Body**

```js
{
    "Name": "Ahmed Ibrahim",
    "Gender": "Male",
    "Age": 29,
    "DateUnit": "Years",
    "Town": "Hawlwadag",
    "Address": "Bakara",
    "Tel": "615301507",
    "MaritalStatus": "Single",
    "City": "Mogadishu",
    "DoctorID": "D0014",
    "PatientType": "OutPatient",
    "Booked": 1,
    "BookingTel": "615301507",
    "AppointmentDate": "2022-01-11"
}
```

> Dev By [websom.dev](https://websom.dev)

> More info: [info@websom.dev](info@websom.dev)
